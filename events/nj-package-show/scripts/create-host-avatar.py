"""Build Blue: Bartenura-product-inspired AI host for the Royal Wine NJ event.
Original character concept; official product forms/logos are visual references,
not a claim that this is approved retail packaging or an official mascot.
"""
import sys
sys.path.append('/usr/lib/python3/dist-packages')
import bpy, math, os
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name,color,rough=.35,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color,1)
 p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if p.inputs.get('Coat Weight'):p.inputs['Coat Weight'].default_value=.35
 return m
blue=material('Bartenura cobalt glass',(.009,.050,.47),.19,.25)
cap=material('Blue capsule',(.018,.035,.13),.38,.25)
ivory=material('Warm ivory paper',(.96,.925,.83),.6)
gold=material('Brushed gold accents',(.72,.50,.18),.3,.65)
black=material('Black Irish dark bottle',(.009,.012,.014),.20,.25)
green=material('Black Irish green capsule',(.014,.18,.084),.32,.2)
dark=material('Facial ink',(.008,.019,.055),.45)
white=material('Eyes',(.96,.97,.94),.3)
root=bpy.data.objects.new('Royal_Wine_Product_Host',None);bpy.context.collection.objects.link(root)
main=bpy.data.objects.new('Bartenura_Bottle_Host',None);bpy.context.collection.objects.link(main);main.parent=root;main.location.x=-.32
companion=bpy.data.objects.new('Black_Irish_Display',None);bpy.context.collection.objects.link(companion);companion.parent=root
companion.location=(.64,.24,-.52);companion.scale=(.66,.66,.66)

def profile(name,rings,mat,parent):
 sides=96;verts=[];faces=[]
 for z,r in rings:
  for i in range(sides):
   t=2*math.pi*i/sides;verts.append((r*math.cos(t),r*math.sin(t),z))
 for j in range(len(rings)-1):
  for i in range(sides):
   k=j*sides+i;n=j*sides+(i+1)%sides;faces.append((k,n,n+sides,k+sides))
 faces.extend([tuple(range(sides-1,-1,-1)),tuple((len(rings)-1)*sides+i for i in range(sides))])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.parent=parent;mesh.materials.append(mat)
 for face in mesh.polygons:face.use_smooth=True
 return o
def sphere(name,loc,size,mat,parent=main):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=(0,0,0))
 o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 for face in o.data.polygons:face.use_smooth=True
 return o
def curve(name,points,r,mat,parent=main):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=4
 s=c.splines.new('POLY');s.points.add(len(points)-1)
 for p,co in zip(s.points,points):p.co=(*co,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(mat);return o
def plane(name,loc,size,mat,parent=main):
 bpy.ops.mesh.primitive_plane_add(size=2)
 o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.rotation_euler=(math.pi/2,0,0);o.scale=(size[0],size[1],1)
 o.data.materials.append(mat);return o
def artwork(name,path,loc,size,parent=main):
 m=material(name,(1,1,1),.6)
 nodes=m.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(os.path.abspath(path));tex.image.pack()
 bsdf=nodes.get('Principled BSDF');m.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
 if tex.image.channels==4:
  m.node_tree.links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha']);m.blend_method='BLEND'
 return plane(name,loc,size,m,parent)
def front_text(name,body,loc,size,mat,parent=main):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.align_x='CENTER';c.size=size;c.extrude=.0005
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(mat)
 return o

# Recognizable cobalt wine-bottle form, long neck and dark-blue capsule.
profile('Bartenura_Cobalt_Silhouette',[(-1.38,.32),(-1.36,.41),(-1.29,.45),(-.95,.455),(.42,.455),(.54,.44),(.68,.38),(.82,.27),(.93,.175),(1.30,.17),(1.34,.18)],blue,main)
profile('Bartenura_Blue_Capsule',[(1.15,.183),(1.53,.183),(1.57,.17)],cap,main)
profile('Bartenura_Capsule_Gold_Line',[(1.15,.185),(1.168,.185)],gold,main)
profile('Bartenura_Heel_Rim',[(-1.37,.407),(-1.345,.437)],cap,main)
front_text('Capsule_wordmark','BARTENURA',(0,-.188,1.19),.053,ivory)

# Facial features live above the intact brand panel; only this bottle speaks.
for side,x in [('L',-.15),('R',.15)]:
 sphere('EyeWhite_'+side,(x,-.437,.28),(.070,.024,.034),white)
 sphere('Iris_'+side,(x,-.461,.279),(.025,.012,.027),dark)
 sphere('Catchlight_'+side,(x-.008,-.472,.290),(.007,.004,.007),white)
 curve('Brow_'+side,[(x-.06,-.442,.374),(x,-.453,.388),(x+.06,-.442,.376)],.009,gold)
mouthZ=.09;w=.135;n=64;verts=[(0,-.463,mouthZ)]
for i in range(n):
 t=2*math.pi*i/n;x=w*math.cos(t)
 verts.append((x,-.465,mouthZ+.016*math.sin(t)+.030*(x/w)**2))
mesh=bpy.data.meshes.new('Blue_Smile_Mesh');mesh.from_pydata(verts,[],[(0,i+1,(i+1)%n+1) for i in range(n)]);mesh.update()
o=bpy.data.objects.new('Blue_Speaking_Mouth',mesh);bpy.context.collection.objects.link(o);o.parent=main;mesh.materials.append(dark)
o.shape_key_add(name='Basis');jaw=o.shape_key_add(name='jawOpen')
for v in jaw.data:
 if v.co.z<mouthZ+.030*(v.co.x/w)**2:v.co.z-=.085*max(0,1-(v.co.x/w)**2)
rounded=o.shape_key_add(name='mouthRound')
for v in rounded.data:v.co.x*=.7;v.co.z=mouthZ+(v.co.z-mouthZ)*1.25
curve('Blue_Smile_Highlight',[(x,-.469,mouthZ+.006+.026*(x/w)**2) for x in [-.108+i*.216/30 for i in range(31)]],.006,ivory)

# Official Bartenura artwork, a map-inspired medallion, and no invented product specs.
plane('Bartenura_Label_Gold_Border',(0,-.465,-.35),(.355,.170),gold)
plane('Bartenura_Label_Ivory',(0,-.469,-.35),(.346,.158),ivory)
artwork('Official_Bartenura_Logo','public/assets/bartenura-logo.jpg',(0,-.474,-.35),(.322,.137))
plane('Origin_Panel_Border',(0,-.463,-.81),(.22,.22),gold)
plane('Origin_Panel',(0,-.467,-.81),(.21,.21),ivory)
# An original abstract vineyard-leaf emblem supports Italian-wine provenance without copying a retail label.
for offset,angle in [(-.06,-.45),(0,0),(.06,.45)]:
 leaf=sphere('Vine_leaf_'+str(offset),(offset,-.480,-.78),(.047,.004,.105),green)
 leaf.rotation_euler.y=angle
front_text('Italian_wine_caption','ITALIAN WINE',(0,-.478,-.985),.043,dark)
front_text('Host_disclosure','AI GUIDE',(0,-.470,-1.18),.055,ivory)

# A separate Black Irish product display: black glass, green capsule, diamond cream label.
profile('Black_Irish_Silhouette',[(-1.36,.35),(-1.32,.45),(-1.23,.44),(.37,.44),(.48,.42),(.63,.34),(.72,.22),(.76,.19),(1.05,.19),(1.18,.14),(1.45,.14)],black,companion)
profile('Black_Irish_Green_Capsule',[(1.03,.151),(1.52,.151),(1.56,.14)],green,companion)
for z in [1.40,1.47,1.52]:
 profile('Capsule_gold_ring_'+str(z),[(z,.154),(z+.012,.154)],gold,companion)
diamond=plane('Black_Irish_Diamond_Border',(0,-.448,-.29),(.265,.34),gold,companion)
diamond.rotation_euler.y=math.pi/4
diamond=plane('Black_Irish_Diamond_Ivory',(0,-.452,-.29),(.254,.329),ivory,companion)
diamond.rotation_euler.y=math.pi/4
artwork('Official_Black_Irish_Logo','public/assets/black-irish-logo.png',(0,-.463,-.21),(.31,.16),companion)
plane('Black_Irish_Green_Band',(0,-.468,-.56),(.42,.085),green,companion)
front_text('Black_Irish_Origin','IRELAND',(0,-.477,-.58),.07,ivory,companion)

# Separate exhibition base carries the parent client mark, not a fictitious crossover product label.
profile('Royal_Wine_Exhibition_Base',[(-1.56,.86),(-1.46,.86),(-1.42,.80)],cap,root)
profile('Exhibition_Base_Gold_Rim',[(-1.47,.86),(-1.45,.86)],gold,root)
plane('Kedem_Platform_Plaque',(0,-.871,-1.51),(.20,.044),ivory,root)
artwork('Official_Kedem_Platform_Logo','public/assets/royal-wine-logo.png',(0,-.875,-1.51),(.19,.041),root)

os.makedirs('design',exist_ok=True);os.makedirs('public/assets',exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath('design/bartenura-host.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/assets/host-avatar.glb'),export_format='GLB',export_morph=True,export_animations=False)
print('Product-inspired Royal Wine host exported with jawOpen and mouthRound.')
