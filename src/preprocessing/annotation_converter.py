"""
RoadWise ML Pipeline — Resolution-Independent Annotation Converter
===================================================================

ROLE IN ROADWISE ML LIFECYCLE:
    Provides permanent, reusable, resolution-independent annotation conversion
    and geometry validation across multiple source formats (Pascal VOC XML,
    YOLO normalized .txt, and normalized polygons) into canonical YOLOv8 format.

KEY PRINCIPLES:
    1. Automatic Image Dimensions:
       Always inspects actual image dimensions (via PIL header/image stream).
       Never hardcodes 640x640 or any dataset-specific assumption.
    2. Metadata Cross-Checking:
       Validates annotation metadata (e.g. Pascal VOC <size>) against actual
       image dimensions, reporting discrepancies instead of silently guessing.
    3. Defensive Bounding Box Validation:
       Validates against inverted, degenerate, zero-area, or completely out-of-bounds
       coordinates. Clips minor out-of-frame boundaries defensively while preserving
       valid geometry.
    4. Format Agnostic & Decoupled:
       Keeps geometric coordinate transformation decoupled from dataset-specific
       class mapping and split assignment rules.
    5. Training Compatibility:
       Preserves source resolutions so downstream YOLOv8 letterbox resizing
       (`imgsz`) operates dynamically at model training time.
"""

from __future__ import annotations

import io
import math
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union
import xml.etree.ElementTree as ET
from PIL import Image


class BoxValidationStatus(str, Enum):
    """Validation outcome for a single bounding box."""
    VALID = "VALID"
    CLIPPED = "CLIPPED"
    FILTERED_DIMENSION = "FILTERED_DIMENSION"
    INVALID_INVERTED = "INVALID_INVERTED"
    INVALID_ZERO_AREA = "INVALID_ZERO_AREA"
    INVALID_OUT_OF_BOUNDS = "INVALID_OUT_OF_BOUNDS"
    UNMAPPED_CLASS = "UNMAPPED_CLASS"


@dataclass(frozen=True)
class ImageDimensions:
    """Immutable representation of image pixel dimensions and aspect ratio."""
    width: int
    height: int

    def __post_init__(self) -> None:
        if self.width <= 0:
            raise ValueError(f"Image width must be positive, got {self.width}")
        if self.height <= 0:
            raise ValueError(f"Image height must be positive, got {self.height}")

    @property
    def aspect_ratio(self) -> float:
        """Width / Height ratio."""
        return self.width / self.height

    @property
    def orientation(self) -> str:
        """Classifies aspect ratio into standard categories."""
        if math.isclose(self.width, self.height, rel_tol=0.01):
            return "square"
        return "landscape" if self.width > self.height else "portrait"

    def to_tuple(self) -> Tuple[int, int]:
        return (self.width, self.height)

    def __str__(self) -> str:
        return f"{self.width}x{self.height} ({self.orientation})"


@dataclass
class BoundingBox:
    """Raw pixel-space bounding box representation (xmin, ymin, xmax, ymax)."""
    xmin: float
    ymin: float
    xmax: float
    ymax: float
    class_name: str
    class_id: Optional[int] = None
    confidence: Optional[float] = None
    extra_attributes: Dict[str, Any] = field(default_factory=dict)

    @property
    def raw_width(self) -> float:
        return self.xmax - self.xmin

    @property
    def raw_height(self) -> float:
        return self.ymax - self.ymin

    @property
    def is_inverted(self) -> bool:
        """True if coordinates are inverted (min > max)."""
        return self.xmin > self.xmax or self.ymin > self.ymax

    @property
    def is_zero_area(self) -> bool:
        """True if width or height is zero or negative."""
        return self.raw_width <= 0.0 or self.raw_height <= 0.0


@dataclass(frozen=True)
class NormalizedYOLOBox:
    """Canonical YOLO normalized bounding box format: <class_id> <cx> <cy> <w> <h>."""
    class_id: int
    x_center: float
    y_center: float
    width: float
    height: float

    def __post_init__(self) -> None:
        for name, val in [("x_center", self.x_center), ("y_center", self.y_center),
                          ("width", self.width), ("height", self.height)]:
            if not (0.0 <= val <= 1.0):
                raise ValueError(f"YOLO coordinate {name} must be in [0.0, 1.0], got {val}")

    def to_yolo_line(self, precision: int = 6) -> str:
        """Formats into standard YOLO txt line."""
        fmt = f"{{:.{precision}f}}"
        cx = fmt.format(self.x_center)
        cy = fmt.format(self.y_center)
        w = fmt.format(self.width)
        h = fmt.format(self.height)
        return f"{self.class_id} {cx} {cy} {w} {h}"


@dataclass
class ConversionResult:
    """Complete, auditable result of converting an image's annotations."""
    image_id: str
    actual_dimensions: ImageDimensions
    metadata_dimensions: Optional[ImageDimensions] = None
    dimension_mismatch: bool = False
    mismatch_details: Optional[str] = None
    valid_boxes: List[NormalizedYOLOBox] = field(default_factory=list)
    clipped_boxes: List[Tuple[BoundingBox, NormalizedYOLOBox]] = field(default_factory=list)
    filtered_boxes: List[Tuple[BoundingBox, str]] = field(default_factory=list)
    invalid_boxes: List[Tuple[BoundingBox, str]] = field(default_factory=list)
    unmapped_boxes: List[BoundingBox] = field(default_factory=list)

    @property
    def has_target_objects(self) -> bool:
        """True if at least one valid target object box exists."""
        return len(self.valid_boxes) > 0

    @property
    def is_usable(self) -> bool:
        """True if image has valid boxes or is a clean background negative."""
        return len(self.invalid_boxes) == 0

    @property
    def status(self) -> str:
        """Summary status code."""
        if self.invalid_boxes:
            return "HAS_INVALID_BOXES"
        if self.dimension_mismatch:
            return "DIMENSION_MISMATCH"
        if self.valid_boxes:
            return "VALID_TARGET_OBJECTS"
        if self.filtered_boxes and not self.valid_boxes:
            return "ALL_BOXES_FILTERED"
        return "EMPTY_BACKGROUND"

    def to_yolo_content(self, precision: int = 6) -> str:
        """Generates the full .txt file content for YOLO training."""
        if not self.valid_boxes:
            return ""
        lines = [b.to_yolo_line(precision=precision) for b in self.valid_boxes]
        return "\n".join(lines) + "\n"

    def to_dict(self) -> Dict[str, Any]:
        """Serializes conversion metrics for structured logging."""
        return {
            "image_id": self.image_id,
            "actual_dimensions": str(self.actual_dimensions),
            "metadata_dimensions": str(self.metadata_dimensions) if self.metadata_dimensions else None,
            "dimension_mismatch": self.dimension_mismatch,
            "mismatch_details": self.mismatch_details,
            "valid_boxes_count": len(self.valid_boxes),
            "clipped_boxes_count": len(self.clipped_boxes),
            "filtered_boxes_count": len(self.filtered_boxes),
            "invalid_boxes_count": len(self.invalid_boxes),
            "unmapped_boxes_count": len(self.unmapped_boxes),
            "status": self.status,
            "is_usable": self.is_usable,
        }


def get_image_dimensions(source: Union[str, Path, bytes, io.BytesIO, Image.Image]) -> ImageDimensions:
    """
    Reads actual image width and height without loading full pixel buffers when possible.

    Args:
        source: Filepath (str/Path), raw image bytes, BytesIO buffer, or PIL Image.

    Returns:
        ImageDimensions instance.

    Raises:
        ValueError: If image dimensions cannot be parsed or are non-positive.
    """
    if isinstance(source, Image.Image):
        w, h = source.size
        return ImageDimensions(width=int(w), height=int(h))

    if isinstance(source, bytes):
        buffer = io.BytesIO(source)
        with Image.open(buffer) as img:
            w, h = img.size
            return ImageDimensions(width=int(w), height=int(h))

    if isinstance(source, io.BytesIO):
        pos = source.tell()
        with Image.open(source) as img:
            w, h = img.size
        source.seek(pos)
        return ImageDimensions(width=int(w), height=int(h))

    # Path-like
    path = Path(source)
    if not path.exists():
        raise FileNotFoundError(f"Image file does not exist: {path}")

    with Image.open(path) as img:
        w, h = img.size
        return ImageDimensions(width=int(w), height=int(h))


def parse_voc_xml(source: Union[str, Path, bytes, ET.Element]) -> Tuple[Optional[ImageDimensions], List[BoundingBox]]:
    """
    Parses Pascal VOC XML annotation into metadata dimensions and raw BoundingBox list.

    Args:
        source: Filepath, XML string, XML bytes, or parsed ElementTree root.

    Returns:
        tuple of (Optional[ImageDimensions from <size>], List[BoundingBox])
    """
    if isinstance(source, ET.Element):
        root = source
    elif isinstance(source, bytes):
        root = ET.fromstring(source.decode("utf-8", errors="replace"))
    elif isinstance(source, (str, Path)):
        p = Path(source)
        if p.exists() and p.is_file():
            root = ET.parse(p).getroot()
        else:
            # Assume it's XML content string
            root = ET.fromstring(str(source))
    else:
        raise TypeError(f"Unsupported XML source type: {type(source)}")

    # Extract metadata size if present
    meta_dims: Optional[ImageDimensions] = None
    size_el = root.find("size")
    if size_el is not None:
        try:
            w_text = size_el.find("width")
            h_text = size_el.find("height")
            if w_text is not None and h_text is not None:
                w_val = int(float(w_text.text.strip()))
                h_val = int(float(h_text.text.strip()))
                if w_val > 0 and h_val > 0:
                    meta_dims = ImageDimensions(width=w_val, height=h_val)
        except (ValueError, AttributeError):
            meta_dims = None

    boxes: List[BoundingBox] = []
    for obj in root.findall("object"):
        name_el = obj.find("name")
        class_name = name_el.text.strip() if (name_el is not None and name_el.text) else ""

        bbox_el = obj.find("bndbox")
        if bbox_el is None:
            continue

        try:
            xmin = float(bbox_el.find("xmin").text)  # type: ignore[union-attr]
            ymin = float(bbox_el.find("ymin").text)  # type: ignore[union-attr]
            xmax = float(bbox_el.find("xmax").text)  # type: ignore[union-attr]
            ymax = float(bbox_el.find("ymax").text)  # type: ignore[union-attr]
        except (ValueError, TypeError, AttributeError):
            continue

        boxes.append(BoundingBox(
            xmin=xmin,
            ymin=ymin,
            xmax=xmax,
            ymax=ymax,
            class_name=class_name
        ))

    return meta_dims, boxes


def convert_box_to_yolo(
    box: BoundingBox,
    img_dims: ImageDimensions,
    target_class_id: int,
    min_box_dim: float = 0.0,
    boundary_tolerance: float = 1.0,
) -> Tuple[Optional[NormalizedYOLOBox], BoxValidationStatus, Optional[str]]:
    """
    Transforms and validates a single bounding box into normalized YOLO coordinates
    using the actual image dimensions.

    Validation pipeline:
    1. Check for inverted coordinates (xmin >= xmax or ymin >= ymax).
    2. Check for zero/negative area.
    3. Check for out-of-bounds coordinates (entirely outside the image).
    4. Perform defensive boundary clamping: [0, width] and [0, height].
    5. Compute normalized center and dimensions in [0.0, 1.0].
    6. Filter by min_box_dim candidate threshold if specified.

    Args:
        box: Raw pixel-space BoundingBox.
        img_dims: Actual verified ImageDimensions.
        target_class_id: Target YOLO class integer ID.
        min_box_dim: Minimum normalized width AND height (e.g. 0.02). Default 0.0.
        boundary_tolerance: Pixel tolerance for coordinates outside frame before flagging.

    Returns:
        (NormalizedYOLOBox or None, BoxValidationStatus, detail_message)
    """
    iw, ih = float(img_dims.width), float(img_dims.height)

    # 1. Inverted coordinates check
    if box.is_inverted:
        return (
            None,
            BoxValidationStatus.INVALID_INVERTED,
            f"Inverted bbox coordinates: xmin={box.xmin} > xmax={box.xmax} or ymin={box.ymin} > ymax={box.ymax}"
        )

    # 2. Zero area check
    if box.is_zero_area:
        return (
            None,
            BoxValidationStatus.INVALID_ZERO_AREA,
            f"Zero or negative area bbox: width={box.raw_width}, height={box.raw_height}"
        )

    # 2. Entirely out-of-bounds check
    if box.xmax <= 0.0 or box.xmin >= iw or box.ymax <= 0.0 or box.ymin >= ih:
        return (
            None,
            BoxValidationStatus.INVALID_OUT_OF_BOUNDS,
            f"Box entirely outside image dimensions ({img_dims}): x=[{box.xmin}, {box.xmax}], y=[{box.ymin}, {box.ymax}]"
        )

    # 3. Defensive clipping to image boundary
    clipped_x1 = max(0.0, min(iw, box.xmin))
    clipped_x2 = max(0.0, min(iw, box.xmax))
    clipped_y1 = max(0.0, min(ih, box.ymin))
    clipped_y2 = max(0.0, min(ih, box.ymax))

    bw_px = clipped_x2 - clipped_x1
    bh_px = clipped_y2 - clipped_y1

    if bw_px <= 0.0 or bh_px <= 0.0:
        return (
            None,
            BoxValidationStatus.INVALID_ZERO_AREA,
            f"Box clipped to zero area: width={bw_px}, height={bh_px} px"
        )

    # 4. Normalization
    norm_cx = ((clipped_x1 + clipped_x2) / 2.0) / iw
    norm_cy = ((clipped_y1 + clipped_y2) / 2.0) / ih
    norm_w = bw_px / iw
    norm_h = bh_px / ih

    # Clamp rounding float inaccuracies to [0.0, 1.0]
    norm_cx = max(0.0, min(1.0, norm_cx))
    norm_cy = max(0.0, min(1.0, norm_cy))
    norm_w = max(0.0, min(1.0, norm_w))
    norm_h = max(0.0, min(1.0, norm_h))

    # 5. Candidate box dimension threshold check
    if min_box_dim > 0.0:
        if norm_w < min_box_dim or norm_h < min_box_dim:
            return (
                None,
                BoxValidationStatus.FILTERED_DIMENSION,
                f"Box dimension below candidate threshold ({min_box_dim:.3f}): w={norm_w:.4f}, h={norm_h:.4f}"
            )

    yolo_box = NormalizedYOLOBox(
        class_id=target_class_id,
        x_center=norm_cx,
        y_center=norm_cy,
        width=norm_w,
        height=norm_h,
    )

    # Check if boundary clipping occurred
    was_clipped = (
        not math.isclose(box.xmin, clipped_x1, abs_tol=boundary_tolerance)
        or not math.isclose(box.xmax, clipped_x2, abs_tol=boundary_tolerance)
        or not math.isclose(box.ymin, clipped_y1, abs_tol=boundary_tolerance)
        or not math.isclose(box.ymax, clipped_y2, abs_tol=boundary_tolerance)
    )

    if was_clipped:
        return (
            yolo_box,
            BoxValidationStatus.CLIPPED,
            f"Box boundary clipped from [{box.xmin:.1f}, {box.ymin:.1f}, {box.xmax:.1f}, {box.ymax:.1f}] to "
            f"[{clipped_x1:.1f}, {clipped_y1:.1f}, {clipped_x2:.1f}, {clipped_y2:.1f}]"
        )

    return (yolo_box, BoxValidationStatus.VALID, None)


def convert_polygon_to_yolo(
    coords: Sequence[float],
    img_dims: ImageDimensions,
    target_class_id: int,
    is_normalized: bool = True,
    min_box_dim: float = 0.0,
) -> Tuple[Optional[NormalizedYOLOBox], BoxValidationStatus, Optional[str]]:
    """
    Transforms a polygon coordinate sequence (x1, y1, x2, y2, ...) into a
    normalized bounding box in YOLO format.

    Args:
        coords: Flattened polygon coordinates [x1, y1, x2, y2, ...].
        img_dims: Actual ImageDimensions.
        target_class_id: Target YOLO class integer ID.
        is_normalized: True if polygon coordinates are already in [0, 1].
        min_box_dim: Candidate threshold filter.

    Returns:
        (NormalizedYOLOBox or None, BoxValidationStatus, detail_message)
    """
    if len(coords) < 6 or len(coords) % 2 != 0:
        return (
            None,
            BoxValidationStatus.INVALID_ZERO_AREA,
            f"Invalid polygon coordinates count: {len(coords)} (minimum 6 values required)"
        )

    xs = coords[0::2]
    ys = coords[1::2]

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    if not is_normalized:
        box = BoundingBox(xmin=min_x, ymin=min_y, xmax=max_x, ymax=max_y, class_name="")
        return convert_box_to_yolo(box, img_dims, target_class_id, min_box_dim=min_box_dim)

    # Already normalized: validate [0, 1] bounds and compute envelope
    min_x = max(0.0, min(1.0, min_x))
    max_x = max(0.0, min(1.0, max_x))
    min_y = max(0.0, min(1.0, min_y))
    max_y = max(0.0, min(1.0, max_y))

    bw = max_x - min_x
    bh = max_y - min_y

    if bw <= 0.0 or bh <= 0.0:
        return (None, BoxValidationStatus.INVALID_ZERO_AREA, f"Degenerate polygon envelope: w={bw}, h={bh}")

    if min_box_dim > 0.0 and (bw < min_box_dim or bh < min_box_dim):
        return (
            None,
            BoxValidationStatus.FILTERED_DIMENSION,
            f"Polygon bounding box below threshold ({min_box_dim}): w={bw:.4f}, h={bh:.4f}"
        )

    cx = (min_x + max_x) / 2.0
    cy = (min_y + max_y) / 2.0

    return (
        NormalizedYOLOBox(
            class_id=target_class_id,
            x_center=cx,
            y_center=cy,
            width=bw,
            height=bh
        ),
        BoxValidationStatus.VALID,
        None
    )


def convert_voc_annotation(
    image_source: Union[str, Path, bytes, io.BytesIO, Image.Image],
    xml_source: Union[str, Path, bytes, ET.Element],
    class_mapping: Optional[Dict[str, int]] = None,
    image_id: Optional[str] = None,
    min_box_dim: float = 0.0,
    dimension_mismatch_tolerance: int = 0,
) -> ConversionResult:
    """
    End-to-end resolution-independent converter for a single Pascal VOC image/annotation pair.

    Workflow:
    1. Reads actual image dimensions directly from the image buffer/file.
    2. Parses Pascal VOC XML, extracting metadata <size> and all <object> bounding boxes.
    3. Cross-checks actual vs metadata dimensions and flags mismatches.
    4. Converts every bounding box using the ACTUAL image dimensions.
    5. Validates, clips, filters, and separates valid, filtered, invalid, and unmapped boxes.

    Args:
        image_source: Image file, path, or bytes.
        xml_source: Pascal VOC XML file, path, or bytes.
        class_mapping: Dict mapping raw class string names to target integer class IDs.
                       If None, raw class strings must be convertible to int.
        image_id: Optional identifier string (default: filename stem).
        min_box_dim: Candidate dimension threshold (e.g. 0.02).
        dimension_mismatch_tolerance: Acceptable pixel difference before flagging dimension mismatch.

    Returns:
        ConversionResult containing all converted boxes, validation metrics, and audit flags.
    """
    # 1. Read actual image dimensions
    actual_dims = get_image_dimensions(image_source)

    if image_id is None:
        if isinstance(image_source, (str, Path)):
            image_id = Path(image_source).name
        elif isinstance(xml_source, (str, Path)):
            image_id = Path(xml_source).stem
        else:
            image_id = "unknown_image"

    # 2. Parse XML metadata and raw bounding boxes
    meta_dims, raw_boxes = parse_voc_xml(xml_source)

    # 3. Cross-check dimensions
    mismatch = False
    mismatch_msg = None
    if meta_dims is not None:
        dw = abs(actual_dims.width - meta_dims.width)
        dh = abs(actual_dims.height - meta_dims.height)
        if dw > dimension_mismatch_tolerance or dh > dimension_mismatch_tolerance:
            mismatch = True
            mismatch_msg = (
                f"Dimension mismatch for {image_id}: actual image is {actual_dims}, "
                f"but XML <size> metadata claims {meta_dims} (diff: dw={dw}, dh={dh})"
            )

    result = ConversionResult(
        image_id=image_id,
        actual_dimensions=actual_dims,
        metadata_dimensions=meta_dims,
        dimension_mismatch=mismatch,
        mismatch_details=mismatch_msg,
    )

    # 4. Convert and validate each box
    for box in raw_boxes:
        # Check class mapping
        target_cid: Optional[int] = None
        if class_mapping is not None:
            if box.class_name not in class_mapping:
                result.unmapped_boxes.append(box)
                continue
            target_cid = class_mapping[box.class_name]
        else:
            try:
                target_cid = int(box.class_name)
            except ValueError:
                result.unmapped_boxes.append(box)
                continue

        yolo_box, status, detail = convert_box_to_yolo(
            box=box,
            img_dims=actual_dims,
            target_class_id=target_cid,
            min_box_dim=min_box_dim
        )

        if status == BoxValidationStatus.VALID:
            assert yolo_box is not None
            result.valid_boxes.append(yolo_box)
        elif status == BoxValidationStatus.CLIPPED:
            assert yolo_box is not None
            result.valid_boxes.append(yolo_box)
            result.clipped_boxes.append((box, yolo_box))
        elif status == BoxValidationStatus.FILTERED_DIMENSION:
            result.filtered_boxes.append((box, detail or "Filtered by min_box_dim"))
        else:
            # Invalid inverted, degenerate, or completely out-of-bounds
            result.invalid_boxes.append((box, detail or f"Invalid box: {status.value}"))

    return result
