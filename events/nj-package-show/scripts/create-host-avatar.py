"""Build Julian, an original adult Royal Wine trade-show ambassador."""
import sys
sys.path.append('/usr/lib/python3/dist-packages')
import bpy,math,os
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,c,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
skin=mat('Warm skin',(.55,.32,.19));hair=mat('Charcoal hair',(.06,.052,.044));coral=mat('Navy business blazer',(.028,.060,.125));teal=mat('Ivory shirt',(.92,.84,.66));cream=mat('Ivory',(.98,.91,.78));dark=mat('Charcoal lapels and eyes',(.018,.025,.025));lip=mat('Smile',(.18,.045,.045));gold=mat('Brushed gold',(.64,.45,.15),.3,.65);silver=mat('Silver temples',(.30,.28,.25))
root=bpy.data.objects.new('Julian',None);bpy.context.collection.objects.link(root)
def sphere(n,loc,scale,m,parent=root):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=loc);o=bpy.context.object;o.name=n;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o.parent=parent
 for f in o.data.polygons:f.use_smooth=True
 return o
def curve(n,pts,r,m):
 c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=4;s=c.splines.new('POLY');s.points.add(len(pts)-1)
 for p,co in zip(s.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.parent=root;o.data.materials.append(m);return o
def profile(n,rings,m,center_y=0):
 verts=[];sides=64
 for z,w,d in rings:
  for i in range(sides):
   a=2*math.pi*i/sides;verts.append((w*math.cos(a),center_y+d*math.sin(a),z))
 faces=[]
 for row in range(len(rings)-1):
  for i in range(sides):
   j=row*sides+i;k=row*sides+(i+1)%sides;faces.append((j,k,k+sides,j+sides))
 faces.extend([tuple(range(sides-1,-1,-1)),tuple((len(rings)-1)*sides+i for i in range(sides))])
 mesh=bpy.data.meshes.new(n);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(n,mesh);bpy.context.collection.objects.link(o);o.parent=root;mesh.materials.append(m)
 for f in mesh.polygons:f.use_smooth=True
 bevel=o.modifiers.new('Tailored softened edges','BEVEL');bevel.width=.025;bevel.segments=3
 return o
def panel(n,points,m):
 mesh=bpy.data.meshes.new(n);mesh.from_pydata(points,[],[tuple(range(len(points)))]);mesh.update();o=bpy.data.objects.new(n,mesh);bpy.context.collection.objects.link(o);o.parent=root;mesh.materials.append(m);return o
profile('Tailored blazer',[(-1.30,.39,.21),(-1.26,.44,.25),(-.84,.47,.27),(-.29,.59,.27),(-.16,.60,.24),(-.04,.39,.19),(.035,.21,.145)],coral,.025)
panel('Ivory shirt',[(-.19,-.20,.02),(.19,-.20,.02),(.20,-.33,-.34),(0,-.30,-.82),(-.20,-.33,-.34)],teal)
sphere('Neck',(0,0,.19),(.15,.135,.29),skin)
sphere('HairBack',(0,.065,.84),(.375,.235,.44),hair)
head=sphere('Face',(0,-.065,.78),(.355,.265,.455),skin)
for v in head.data.vertices:
 if v.co.z<-.13:v.co.x*=1-(abs(v.co.z)-.13)*.40
sphere('HairCap',(0,.015,1.155),(.36,.24,.19),hair)
strand=sphere('Swept fringe',(-.08,-.266,1.09),(.25,.055,.083),hair);strand.rotation_euler.y=-.32
strand=sphere('Parted fringe',(.19,-.217,1.145),(.12,.065,.085),hair);strand.rotation_euler.y=.35
for side,x in [('L',-.128),('R',.128)]:
 sphere('Ear_'+side,(x*2.6,-.015,.77),(.05,.05,.092),skin)
 sphere('Silver temple_'+side,(x*2.7,-.047,1.02),(.022,.18,.10),silver)
 sphere('EyeWhite_'+side,(x,-.304,.876),(.076,.022,.037),cream)
 sphere('Iris_'+side,(x,-.326,.875),(.027,.011,.029),dark)
 sphere('Catchlight_'+side,(x-.007,-.337,.884),(.007,.005,.009),cream)
 curve('Brow_'+side,[(x-.061,-.302,.950),(x-.005,-.316,.969),(x+.062,-.303,.95)],.012,hair)
 arm=sphere('Arm_'+side,(x*4.15,.035,-.65),(.145,.175,.53),coral);arm.rotation_euler.y=(-.075 if side=='L' else .075)
 sphere('Hand_'+side,(x*4.20,-.004,-1.11),(.077,.071,.145),skin)
 sign=-1 if side=='L' else 1
 panel('Jacket lapel_'+side,[(sign*.20,-.172,.02),(sign*.37,-.227,-.20),(sign*.28,-.281,-.36),(sign*.15,-.295,-.70),(sign*.07,-.29,-.33)],dark)
panel('Open collar left',[(-.18,-.213,.04),(-.02,-.233,-.045),(-.10,-.26,-.24),(-.22,-.262,-.11)],cream)
panel('Open collar right',[(.18,-.213,.04),(.02,-.233,-.045),(.10,-.26,-.24),(.22,-.262,-.11)],cream)
curve('Blue lanyard',[(-.12,-.275,-.17),(-.085,-.34,-.46),(0,-.345,-.55),(.085,-.34,-.46),(.12,-.275,-.17)],.009,coral)
bpy.ops.mesh.primitive_plane_add(size=2,location=(0,-.354,-.51),rotation=(math.pi/2,0,0));badge=bpy.context.object;badge.name='Official Kedem badge';badge.scale=(.14,.075,1);badge.parent=root
badge_mat=mat('Kedem badge artwork',(1,1,1));nodes=badge_mat.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(os.path.abspath('public/assets/royal-wine-logo.png'));badge_mat.node_tree.links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color']);badge_mat.node_tree.links.new(tex.outputs['Alpha'],nodes.get('Principled BSDF').inputs['Alpha']);badge_mat.blend_method='BLEND';badge.data.materials.append(badge_mat)
bpy.ops.mesh.primitive_plane_add(size=2,location=(0,-.350,-.51),rotation=(math.pi/2,0,0));backer=bpy.context.object;backer.name='Official Kedem badge backer';backer.scale=(.145,.080,1);backer.parent=root;backer.data.materials.append(cream)
sphere('Nose bridge',(0,-.320,.803),(.032,.036,.074),skin)
sphere('Nose tip',(0,-.353,.764),(.043,.042,.041),skin)
sphere('Gold lapel pin',(.37,-.245,-.31),(.031,.011,.038),gold)
curve('Blazer center seam',[(0,-.251,-1.27),(0,-.273,-.86)],.0035,cream)
for z in [-.86,-1.04]:sphere('Blazer button '+str(z),(.024,-.277,z),(.012,.007,.012),gold)
verts=[(0,-.305,.628)];n=64
for i in range(n):
 a=2*math.pi*i/n;x=.13*math.cos(a);verts.append((x,-.310,.623+.017*math.sin(a)+.030*(x/.13)**2))
mesh=bpy.data.meshes.new('SmileMesh');mesh.from_pydata(verts,[],[(0,i+1,(i+1)%n+1) for i in range(n)]);mesh.update();o=bpy.data.objects.new('Smile',mesh);bpy.context.collection.objects.link(o);o.parent=root;mesh.materials.append(lip);o.shape_key_add(name='Basis');k=o.shape_key_add(name='jawOpen')
for v in k.data:
 if v.co.z<.623+.030*(v.co.x/.13)**2:v.co.z-=.07*max(0,1-(v.co.x/.13)**2)
k=o.shape_key_add(name='mouthRound')
for v in k.data:v.co.x*=.7;v.co.z=.623+(v.co.z-.623)*1.25
curve('SmileTeeth',[(x,-.314,.630+.025*(x/.13)**2) for x in [-.105+i*.21/30 for i in range(31)]],.008,cream)
for part in list(root.children):
 if part.name.startswith(('Tailored','Ivory shirt','Arm_','Hand_','Jacket lapel','Blazer','Open collar','Blue lanyard','Official Kedem','Gold lapel')):part.location.z+=.12
os.makedirs('public/assets',exist_ok=True);os.makedirs('design',exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath('design/julian.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/assets/host-avatar.glb'),export_format='GLB',export_morph=True,export_animations=False)
print('Julian exported with jawOpen and mouthRound morphs.')
