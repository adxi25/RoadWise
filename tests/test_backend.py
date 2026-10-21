"""
test_backend.py — Backend tests for RoadWise ML Test Bench.

Tests:
  1. Health endpoint returns 200
  2. Models endpoint lists models with correct keys
  3. Class mapping matches canonical RoadWise IDs
  4. Predict with missing model key returns 400
  5. Predict with wrong file type returns 415
  6. Compare endpoint structure

Run:
  pip install pytest httpx
  cd backend/
  pytest test_backend.py -v
"""

import io
import os
import sys
import json
import base64
from pathlib import Path

import pytest

# Make sure we can import backend modules
sys.path.insert(0, str(Path(__file__).parent))

# ─────────────────────────────────────────────────────────────────────────────
# Pytest fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client():
    """Return a TestClient for the FastAPI app."""
    from fastapi.testclient import TestClient
    from main import app
    with TestClient(app) as c:
        yield c


def _small_jpeg() -> bytes:
    """Generate a tiny valid JPEG image in memory."""
    try:
        from PIL import Image as PILImage
        img = PILImage.new("RGB", (64, 64), color=(100, 150, 200))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return buf.getvalue()
    except ImportError:
        # Fall back to a minimal 64x64 white JPEG if Pillow not available
        return (
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
            b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c"
            b"\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c"
            b"\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\x1edL\tE\x84\xa4\x99\xa4"
            b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f"
            b"\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00"
            b"\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00"
            b"\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03"
            b"\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07\"q\x142\x81\x91\xa1\x08#B\xb1"
            b"\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&'()*456789:CDEFGHI"
            b"JKLMNOPQRSTUVWXYZ\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xd5\xff\xd9"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_200(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200

    def test_health_has_required_fields(self, client):
        r = client.get("/api/health")
        data = r.json()
        assert "status" in data
        assert "device" in data
        assert "message" in data

    def test_health_status_ok(self, client):
        r = client.get("/api/health")
        assert r.json()["status"] == "ok"


class TestModels:
    def test_models_returns_200(self, client):
        r = client.get("/api/models")
        assert r.status_code == 200

    def test_models_contains_baseline_and_candidate(self, client):
        r = client.get("/api/models")
        data = r.json()
        keys = {m["key"] for m in data["models"]}
        assert "baseline" in keys
        assert "candidate" in keys

    def test_roadwise_class_mapping_correct(self, client):
        r = client.get("/api/models")
        data = r.json()
        # Canonical RoadWise classes
        canonical = {"0": "D00", "1": "D10", "2": "D20", "3": "D40"}
        for k, v in canonical.items():
            assert data["roadwise_classes"].get(k) == v, (
                f"Class {k}: expected '{v}', got '{data['roadwise_classes'].get(k)}'"
            )

    def test_each_model_has_required_fields(self, client):
        r = client.get("/api/models")
        for model in r.json()["models"]:
            assert "key" in model
            assert "name" in model
            assert "checkpoint_path" in model
            assert "available" in model
            assert "num_classes" in model
            assert isinstance(model["available"], bool)


class TestPredict:
    def test_predict_invalid_model_key_returns_400(self, client):
        img = _small_jpeg()
        r = client.post(
            "/api/predict",
            data={"model_key": "hacked_path", "confidence": "0.25", "image_size": "640"},
            files={"files": ("test.jpg", img, "image/jpeg")},
        )
        assert r.status_code == 400

    def test_predict_wrong_mime_returns_415(self, client):
        r = client.post(
            "/api/predict",
            data={"model_key": "baseline", "confidence": "0.25", "image_size": "640"},
            files={"files": ("test.txt", b"not an image", "text/plain")},
        )
        assert r.status_code == 415

    def test_predict_out_of_range_confidence_returns_400(self, client):
        img = _small_jpeg()
        r = client.post(
            "/api/predict",
            data={"model_key": "baseline", "confidence": "1.5", "image_size": "640"},
            files={"files": ("test.jpg", img, "image/jpeg")},
        )
        assert r.status_code == 400

    def test_predict_invalid_image_size_returns_400(self, client):
        img = _small_jpeg()
        r = client.post(
            "/api/predict",
            data={"model_key": "baseline", "confidence": "0.25", "image_size": "999"},
            files={"files": ("test.jpg", img, "image/jpeg")},
        )
        assert r.status_code == 400

    @pytest.mark.skipif(
        not Path("models/best.pt").exists() and not Path("../models/best.pt").exists() and not os.environ.get("BASELINE_MODEL_PATH"),
        reason="Baseline checkpoint not available — skipping inference test",
    )
    def test_predict_baseline_returns_valid_structure(self, client):
        img = _small_jpeg()
        r = client.post(
            "/api/predict",
            data={"model_key": "baseline", "confidence": "0.25", "image_size": "640",
                  "include_original": "False"},
            files={"files": ("test.jpg", img, "image/jpeg")},
        )
        assert r.status_code == 200
        data = r.json()
        assert "results" in data
        assert "total_images" in data
        assert data["total_images"] == 1
        result = data["results"][0]
        assert "detections" in result
        assert "total_detections" in result
        assert "inference_time_ms" in result
        assert "annotated_image_b64" in result
        assert isinstance(result["total_detections"], int)
        assert result["inference_time_ms"] >= 0


class TestCompare:
    def test_compare_invalid_confidence_returns_400(self, client):
        img = _small_jpeg()
        r = client.post(
            "/api/compare",
            data={"confidence": "2.0", "image_size": "640"},
            files={"files": ("test.jpg", img, "image/jpeg")},
        )
        assert r.status_code == 400


class TestClassMappingModule:
    """Unit tests for model_manager module (no YOLO model required)."""

    def test_roadwise_short_has_four_classes(self):
        from model_manager import ROADWISE_SHORT
        assert len(ROADWISE_SHORT) == 4
        assert ROADWISE_SHORT[0] == "D00"
        assert ROADWISE_SHORT[1] == "D10"
        assert ROADWISE_SHORT[2] == "D20"
        assert ROADWISE_SHORT[3] == "D40"

    def test_class_color_hex_returns_valid_hex(self):
        from model_manager import get_class_color_hex
        for cid in (0, 1, 2, 3):
            hex_val = get_class_color_hex(cid)
            assert hex_val.startswith("#"), f"Class {cid}: expected hex, got {hex_val}"
            assert len(hex_val) == 7

    def test_unknown_model_key_raises_value_error(self):
        from model_manager import get_model
        with pytest.raises((ValueError, FileNotFoundError)):
            get_model("../../../../etc/passwd")

    def test_build_model_registry_returns_baseline_and_candidate(self):
        from model_manager import build_model_registry
        reg = build_model_registry()
        assert "baseline" in reg
        assert "candidate" in reg
        for key, info in reg.items():
            assert "name" in info
            assert "checkpoint_path" in info


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
