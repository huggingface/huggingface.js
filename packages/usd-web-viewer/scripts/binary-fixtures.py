# Writes the binary fixtures from their usda sources with Pixar's OpenUSD:
# fixtures/implicit_gprims.usdc and fixtures/uv_set.usdz.
# usage: pip install usd-core && python scripts/binary-fixtures.py
import os

from pxr import Sdf, UsdUtils

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fixtures"))
assert Sdf.Layer.FindOrOpen("implicit_gprims.usda").Export("implicit_gprims.usdc", args={"format": "usdc"})
assert UsdUtils.CreateNewUsdzPackage("uv_set.usda", "uv_set.usdz")
