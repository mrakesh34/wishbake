import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data import PRESET_CAKES


REMOVED_CAKE_IDS = {
    "cake-citrus-berry-bliss",
    "cake-rose-pistachio",
    "cake-redvelvet-cheesecake",
    "cake-mishti-doi",
    "cake-black-forest-classic",
    "cake-anjeer-badam",
    "cake-banoffee-crunch",
    "cake-paan-delight",
}


def _is_valid_image_header(data: bytes) -> bool:
    return (
        data.startswith(b"\xff\xd8\xff")
        or data.startswith(b"\x89PNG\r\n\x1a\n")
        or (data.startswith(b"RIFF") and data[8:12] == b"WEBP")
    )


class CatalogImagesTests(unittest.TestCase):
    def test_removed_cakes_are_absent_and_expected_count_matches(self):
        ids = {cake["id"] for cake in PRESET_CAKES}
        self.assertEqual(len(PRESET_CAKES), 12)
        self.assertTrue(ids.isdisjoint(REMOVED_CAKE_IDS))

    def test_all_catalog_images_exist_and_are_real_images(self):
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        public_dir = os.path.join(repo_root, "frontend", "public")

        for cake in PRESET_CAKES:
            all_paths = [cake["image"], *cake.get("images", [])]
            self.assertGreaterEqual(len(cake.get("images", [])), 1, msg=cake["id"])
            for rel_path in all_paths:
                self.assertTrue(rel_path.startswith("/assets/images/"), msg=rel_path)
                disk_path = os.path.join(public_dir, rel_path.lstrip("/").replace("/", os.sep))
                self.assertTrue(os.path.isfile(disk_path), msg=f"Missing image file: {disk_path}")
                with open(disk_path, "rb") as fh:
                    header = fh.read(16)
                self.assertTrue(
                    _is_valid_image_header(header),
                    msg=f"Corrupt or non-image file: {disk_path}",
                )


if __name__ == "__main__":
    unittest.main()
