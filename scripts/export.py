import sys
import bpy

curpath = bpy.data.filepath
curpath.replace("blend", "glb")
bpy.ops.export_scene.gltf(filepath=curpath)

bpy.ops.wm.quit_blender()