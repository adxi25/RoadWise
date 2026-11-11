"""
Automated Unit Tests for Resolution-Independent Annotation Converter
===================================================================

Tests:
1. Aspect ratios and orientations: Square, Landscape, and Portrait.
2. Coordinate normalization mathematics across non-standard resolutions.
3. Coordinate boundary clipping (near image edges).
4. Invalid coordinate detection (inverted, zero area, out-of-bounds).
5. Dimension mismatch detection between actual image and XML metadata.
6. Candidate box dimension threshold filtering (e.g. 0.02).
7. Polygon to YOLO envelope conversion.
8. Unmapped class filtering and empty background handling.
"""

import io
import xml.etree.ElementTree as ET
import pytest
from PIL import Image

from src.preprocessing.annotation_converter import (
    BoxValidationStatus,
    ImageDimensions,
    BoundingBox,
    NormalizedYOLOBox,
    get_image_dimensions,
    parse_voc_xml,
    convert_box_to_yolo,
    convert_polygon_to_yolo,
    convert_voc_annotation,
)


def create_dummy_image(width: int, height: int, color="blue") -> io.BytesIO:
    """Helper to create an in-memory JPEG image with specified dimensions."""
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color=color)
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


def create_dummy_voc_xml(width: int, height: int, objects: list) -> str:
    """Helper to build a Pascal VOC XML string."""
    obj_xml = ""
    for name, (x1, y1, x2, y2) in objects:
        obj_xml += f"""
        <object>
            <name>{name}</name>
            <bndbox>
                <xmin>{x1}</xmin>
                <ymin>{y1}</ymin>
                <xmax>{x2}</xmax>
                <ymax>{y2}</ymax>
            </bndbox>
        </object>
        """
    return f"""<annotation>
        <size>
            <width>{width}</width>
            <height>{height}</height>
            <depth>3</depth>
        </size>
        {obj_xml}
    </annotation>"""


class TestImageDimensions:
    """Tests for ImageDimensions dataclass and get_image_dimensions function."""

    def test_square_dimensions(self):
        dims = ImageDimensions(640, 640)
        assert dims.orientation == "square"
        assert dims.aspect_ratio == pytest.approx(1.0)
        assert dims.to_tuple() == (640, 640)

    def test_landscape_dimensions(self):
        dims = ImageDimensions(1479, 508)
        assert dims.orientation == "landscape"
        assert dims.aspect_ratio == pytest.approx(1479 / 508)

        dims_fhd = ImageDimensions(1920, 1080)
        assert dims_fhd.orientation == "landscape"
        assert dims_fhd.aspect_ratio == pytest.approx(16 / 9)

    def test_portrait_dimensions(self):
        dims = ImageDimensions(1080, 1920)
        assert dims.orientation == "portrait"
        assert dims.aspect_ratio == pytest.approx(1080 / 1920)

    def test_non_positive_dimensions_raise(self):
        with pytest.raises(ValueError, match="width must be positive"):
            ImageDimensions(0, 640)
        with pytest.raises(ValueError, match="height must be positive"):
            ImageDimensions(640, -10)

    def test_get_image_dimensions_from_bytes(self):
        buf = create_dummy_image(1479, 508)
        dims = get_image_dimensions(buf)
        assert dims.width == 1479
        assert dims.height == 508

    def test_get_image_dimensions_from_pil(self):
        img = Image.new("RGB", (1920, 1080))
        dims = get_image_dimensions(img)
        assert dims.width == 1920
        assert dims.height == 1080


class TestVOCXMLParsing:
    """Tests for parse_voc_xml."""

    def test_parse_valid_xml(self):
        xml_str = create_dummy_voc_xml(1479, 508, [
            ("Alligator crack - High", (100, 200, 400, 350)),
            ("Weathering - Low", (500, 100, 700, 250)),
        ])
        meta_dims, boxes = parse_voc_xml(xml_str)
        assert meta_dims is not None
        assert meta_dims.width == 1479
        assert meta_dims.height == 508
        assert len(boxes) == 2
        assert boxes[0].class_name == "Alligator crack - High"
        assert boxes[0].xmin == 100
        assert boxes[0].ymax == 350

    def test_parse_xml_missing_size(self):
        xml_str = """<annotation>
            <object>
                <name>D20</name>
                <bndbox><xmin>10</xmin><ymin>20</ymin><xmax>50</xmax><ymax>60</ymax></bndbox>
            </object>
        </annotation>"""
        meta_dims, boxes = parse_voc_xml(xml_str)
        assert meta_dims is None
        assert len(boxes) == 1
        assert boxes[0].class_name == "D20"


class TestCoordinateConversionAndGeometry:
    """Tests for box normalization and coordinate conversion."""

    def test_landscape_coordinate_math(self):
        """
        Verify that coordinates with x > 640 on a 1479x508 image
        (which were previously destroyed by the 640x640 assumption)
        are converted accurately.
        """
        dims = ImageDimensions(1479, 508)
        # Bbox located in the right half of the image (x: 700 to 1100)
        box = BoundingBox(xmin=700.0, ymin=100.0, xmax=1100.0, ymax=300.0, class_name="D20")

        yolo_box, status, detail = convert_box_to_yolo(box, dims, target_class_id=2)
        assert status == BoxValidationStatus.VALID
        assert yolo_box is not None
        assert yolo_box.class_id == 2
        # Expected center: (700 + 1100)/2 / 1479 = 900 / 1479
        assert yolo_box.x_center == pytest.approx(900.0 / 1479.0, abs=1e-5)
        # Expected cy: (100 + 300)/2 / 508 = 200 / 508
        assert yolo_box.y_center == pytest.approx(200.0 / 508.0, abs=1e-5)
        # Expected width: 400 / 1479
        assert yolo_box.width == pytest.approx(400.0 / 1479.0, abs=1e-5)
        # Expected height: 200 / 508
        assert yolo_box.height == pytest.approx(200.0 / 508.0, abs=1e-5)

    def test_boundary_clipping(self):
        """Coordinates slightly outside boundary should be defensively clipped."""
        dims = ImageDimensions(1920, 1080)
        # xmin < 0, xmax > 1920
        box = BoundingBox(xmin=-15.0, ymin=100.0, xmax=1930.0, ymax=500.0, class_name="D20")
        yolo_box, status, detail = convert_box_to_yolo(box, dims, target_class_id=0)

        assert status == BoxValidationStatus.CLIPPED
        assert yolo_box is not None
        # Clipped x1=0, x2=1920 -> center = 0.5, width = 1.0
        assert yolo_box.x_center == pytest.approx(0.5, abs=1e-5)
        assert yolo_box.width == pytest.approx(1.0, abs=1e-5)

    def test_inverted_coordinates_rejected(self):
        dims = ImageDimensions(640, 640)
        box = BoundingBox(xmin=300.0, ymin=100.0, xmax=200.0, ymax=400.0, class_name="D20")
        yolo_box, status, detail = convert_box_to_yolo(box, dims, target_class_id=0)
        assert status == BoxValidationStatus.INVALID_INVERTED
        assert yolo_box is None

    def test_out_of_bounds_rejected(self):
        dims = ImageDimensions(640, 640)
        # Box entirely to the right
        box = BoundingBox(xmin=700.0, ymin=100.0, xmax=800.0, ymax=200.0, class_name="D20")
        yolo_box, status, detail = convert_box_to_yolo(box, dims, target_class_id=0)
        assert status == BoxValidationStatus.INVALID_OUT_OF_BOUNDS
        assert yolo_box is None

    def test_zero_area_rejected(self):
        dims = ImageDimensions(640, 640)
        box = BoundingBox(xmin=100.0, ymin=100.0, xmax=100.0, ymax=200.0, class_name="D20")
        yolo_box, status, detail = convert_box_to_yolo(box, dims, target_class_id=0)
        assert status == BoxValidationStatus.INVALID_ZERO_AREA
        assert yolo_box is None

    def test_min_box_dim_threshold_filtering(self):
        dims = ImageDimensions(1000, 1000)
        # Box width = 10px -> 0.01 normalized (below 0.02)
        box = BoundingBox(xmin=100.0, ymin=100.0, xmax=110.0, ymax=200.0, class_name="D20")
        yolo_box, status, detail = convert_box_to_yolo(box, dims, target_class_id=0, min_box_dim=0.02)
        assert status == BoxValidationStatus.FILTERED_DIMENSION
        assert yolo_box is None


class TestDimensionMismatchAndEndToEnd:
    """Tests for convert_voc_annotation with dimension mismatch detection."""

    def test_dimension_mismatch_detected_but_image_size_used(self):
        # Image is 1920x1080, but XML falsely claims 640x640
        img_buf = create_dummy_image(1920, 1080)
        xml_str = create_dummy_voc_xml(640, 640, [
            ("D20", (100, 100, 500, 400)),
        ])

        res = convert_voc_annotation(
            image_source=img_buf,
            xml_source=xml_str,
            class_mapping={"D20": 2},
            min_box_dim=0.02
        )

        assert res.dimension_mismatch is True
        assert res.actual_dimensions.width == 1920
        assert res.actual_dimensions.height == 1080
        assert res.metadata_dimensions.width == 640
        assert res.metadata_dimensions.height == 640
        assert "Dimension mismatch" in (res.mismatch_details or "")

        # Box must be normalized against ACTUAL image size (1920x1080)
        assert len(res.valid_boxes) == 1
        ybox = res.valid_boxes[0]
        assert ybox.width == pytest.approx(400.0 / 1920.0, abs=1e-5)
        assert ybox.height == pytest.approx(300.0 / 1080.0, abs=1e-5)

    def test_unmapped_class_handling(self):
        img_buf = create_dummy_image(640, 640)
        xml_str = create_dummy_voc_xml(640, 640, [
            ("D20", (100, 100, 300, 300)),
            ("Weathering - Low", (350, 350, 500, 500)),  # Not in class_map
        ])

        res = convert_voc_annotation(
            image_source=img_buf,
            xml_source=xml_str,
            class_mapping={"D20": 2},
        )

        assert len(res.valid_boxes) == 1
        assert len(res.unmapped_boxes) == 1
        assert res.unmapped_boxes[0].class_name == "Weathering - Low"


class TestPolygonConversion:
    """Tests for convert_polygon_to_yolo."""

    def test_normalized_polygon_envelope(self):
        dims = ImageDimensions(640, 640)
        # Normalized triangle polygon: (0.1, 0.2), (0.4, 0.2), (0.25, 0.6)
        poly = [0.1, 0.2, 0.4, 0.2, 0.25, 0.6]
        yolo_box, status, detail = convert_polygon_to_yolo(poly, dims, target_class_id=1)

        assert status == BoxValidationStatus.VALID
        assert yolo_box is not None
        # x: min 0.1, max 0.4 -> cx = 0.25, w = 0.3
        # y: min 0.2, max 0.6 -> cy = 0.4, h = 0.4
        assert yolo_box.x_center == pytest.approx(0.25, abs=1e-5)
        assert yolo_box.y_center == pytest.approx(0.40, abs=1e-5)
        assert yolo_box.width == pytest.approx(0.30, abs=1e-5)
        assert yolo_box.height == pytest.approx(0.40, abs=1e-5)

