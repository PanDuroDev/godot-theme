// Icon pipeline: categorization rules + bulk download + manifest.
//   node scripts/build-icons.mjs --cats <names.json>   # analyze rules locally (no download)
//   node scripts/build-icons.mjs [--force]              # download all + write icons/manifest.json
// Rules are ordered — first match wins. No per-file mapping: everything new is
// auto-sorted; leftovers land in Misc and get reported so rules can grow.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'icons', 'godot');
const MANIFEST = join(root, 'icons', 'manifest.json');
const RAW = 'https://raw.githubusercontent.com/godotengine/godot/master/editor/icons/';
const API = 'https://api.github.com/repos/godotengine/godot/git/trees/master?recursive=1';

// [category, regex on name without .svg] — keep specific groups before generic ones.
const RULES = [
  ['Brand', /^(Godot|DefaultProjectIcon|TitleBarLogo|Logo|Preview)/],
  ['Editor', /^(Editor|History|Ruler)/],
  ['Toolbar Tools', /^Tools?/],
  ['GUI Chrome', /^Gui/],
  ['Nodes · 2D', /2D/],
  ['Nodes · 3D', /3D/],
  ['Audio', /^(Audio|Sample)/],
  ['Media', /^(Video|Stream|MainMovie|Movie)/],
  ['Animation', /^(Anim|Tween|Track|Blend|StateMachine|Animation|Key(?!(board|word))|Interp|Transition|Timeline|Insert|Auto|Loop|Fade|Marker|Time|UseBlend|RootMotion|Onion|Bake)/],
  ['Shaders & Materials', /^(Shader|VisualShader|Material|StandardMaterial|Texture|Sky|Environment|Image|Panorama|Procedural|Physical|BitMap|Blit|Cubemap|RDShader)|(Material|Texture|Cubemap|Sky)$/],
  ['Meshes', /Mesh$|^Quad|^MeshLibrary|^MeshItem/],
  ['Scripting', /^(Script|GDScript|VisualScript|CSharp|Class|Method|Member|Property|Signal|Function|Variable|Constant|Annotation|Breakpoint|Bookmark|Call|Lambda|Yield|Code|Syntax|RegEx|Match|Enum|LocalVariable|Keyword|Operator|Constructor)/],
  ['Variants & Types', /^(bool|float|int|uint|Nil|RID|UID|Variant|String(Name)?|Vector[234]i?|Rect2i?|Plane|AABB|Basis|Quaternion|Packed.*|Array|Dictionary)$/],
  ['Physics & Collision', /^(Area|Body|Shape|Collision|RayCast|Joint|Spring|Pin|Vehicle|Physics|SoftBody|RigidBody|StaticBody|AnimatableBody|CharacterBody|PhysicalBone|DampedSpring|WorldBoundary|HeightMap|SeparationRay|ShapeCast)/],
  ['Navigation & AI', /^Navig/],
  ['Rendering & Light', /^(Light|Directional|Omni|Spot|Reflection|Voxel|Lightmap|Fog|Decal|Particles|GPUParticles|CPUParticles|Sprite|MultiMesh|Skeleton|Bone|IK|Camera|Listener|Occluder|Visibility|Glow|Backdrop|SDFGI|SSIL|SSAO|Glow|Overbright)/],
  ['Gizmos & Handles', /^(Gizmo|Handle|Pivot|Anchor|Position|DragHandle)/],
  ['Tiles & Canvas', /^(Tile|Canvas|YSort|TouchScreen|Parallax|BackBuffer|Polygon|Line2D|PointLight|LightOccluder|Terrain|RegionEdit|Bucket|Paint|Eraser|CombineLines|Uv|OneWay)/],
  ['UI Controls', /^(Control|Button|Check|Radio|Label|LineEdit|TextEdit|Tree|ItemList|Tab|Scroll|Slider|SpinBox|ProgressBar|Progress|Separator|Panel|BoxContainer|GridContainer|SplitContainer|MenuBar|MenuButton|OptionButton|ColorPicker|Graph|Dock|CodeEdit|LinkButton|Range|Tooltip|Status|SearchBox|Item|Column|Row|Section|Inspector|SpinSlider|Container|FoldableContainer|Grid|SidebarLeft|ListSelect|Slot|TripleBar|Theme|StyleBox|Embed|KeepAspect|FixedSize|Hsize|NinePatchRect|ReferenceRect|Rectangle|Notification|HBox|VBox|HFlow|VFlow|HScroll|VScroll|HSeparator|VSeparator|HSlider|VSlider|HSplit|VSplit|BaseButton|Line$)/],
  ['Files & Folders', /^(File|Folder|Dir|Drive|Recent|ExternalLink|Import|Export|Save|Load|OpenFile|SaveFile|Directory|Asset|Thumb|Verified)/],
  ['Input', /^(Input|Keyboard|Mouse|Joypad|Joy|Touch|Shortcut|Action|Deadzone|Vibrate|Gamepad|Pen|Tablet|Modifiers|Virtual)/],
  ['Text & Fonts', /^(Font|Text|RichText|LabelSettings|TextServer|DynamicFont|SystemFont|FontFile|BMFont|Character|Glyph|Kerning|Locale|Translation)/],
  ['Curves & Gradients', /^(Curve|Gradient|Bezier|Reverse)/],
  ['Colors', /^Color/],
  ['Nodes Core', /^(Node|CanvasItem|CanvasLayer|RemoteTransform|Multiplayer|SceneTree|Scene|Viewport|Window|Timer|Engine|OS|World|Instance|Remote|LookAt|BoneAttachment|SkeletonModifier|PathFollow|Path2D|Path3D|Ragdoll|PhysicalSkeleton|SubViewport|AcceptDialog|ConfirmationDialog|Popup|PopupMenu|PopupPanel|ColorPickerButton|TabBar|TabContainer|FlowContainer|Center|Margin|AspectRatio|GridMap|Object|Missing|Unlinked|Override|Reparent|Resource|Hierarchy|HTTPRequest|MiniObject|Random)/],
  ['Debug & Profiling', /^(Debug|Profiler|Monitor|Performance|Output|Error|Warning|Bug|Doctor|VisualProfiler|Failure|Crash|Leak|Validate|FPS|Suspend|Terminal)/],
  ['Project & Build', /^(Project|Export|Version|Release|Renderer|GLES|Vulkan|MainScreen|LowProcessor|Build|Run|Deploy|Plugin|Addon|GDExtension|DotNet|Mono|Orientation|Platform|Preset|Feature|Tag|Layer|Group|Game|IOS|VCS|Vcs|X509|Crypto|Main)/],
  ['Arrows & Pages', /^(Arrow|Back|Page|NextFrame)/],
  ['Actions', /^(Add|Remove|Delete|Clear|Rename|Edit|Duplicate|Play|Stop|Pause|Search|Zoom|Collapse|Expand|New|Open|Close|Copy|Cut|Paste|Undo|Redo|Select|Move|Rotate|Scale|Snap|Lock|Unlock|Show|Hide|Reveal|Refresh|Reload|Settings|Help|Info|Favorites|Heart|Download|Upload|Share|Repeat|Shuffle|Step|Skip|Rewind|Forward|Backward|Exit|Minimize|Maximize|Restore|Pin|Group|Ungroup|Link|Merge|Join|Sort|Filter|Find|Replace|Pick|Dropper|Goto|Jump|Center|Fit|Stretch|Reset|Create|Make|Generate|Convert|Instance2D|Mirror|Flip|ZoomIn|ZoomOut|ZoomReset|DistractionFree|SplitView|BottomPanel|SnapGrid|GridSnap|UseSnap|SmartSnap|Constrain|LocalSpace|GlobalSpace|TopLevel|EditableChildren|EditableInstance|Pinned|Favorite|Unfavorite|LockChildren|GroupSelected|SelectNext|SelectPrevious|RotateLeft|RotateRight)/],
];

export function categorize(file) {
  const n = file.replace(/\.svg$/i, '');
  for (const [cat, re] of RULES) if (re.test(n)) return cat;
  return 'Misc';
}

async function listRemote() {
  const r = await fetch(API, { headers: { 'User-Agent': 'godot-theme' } });
  if (!r.ok) throw new Error('tree API ' + r.status);
  const t = await r.json();
  return t.tree.filter((e) => e.type === 'blob' && /^editor\/icons\/.*\.svg$/.test(e.path))
    .map((e) => e.path.split('/').pop()).sort();
}

async function download(names, force) {
  mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0, skip = 0, fail = [];
  const q = [...names];
  const workers = Array.from({ length: 8 }, async () => {
    while (q.length) {
      const n = q.pop();
      const dest = join(OUT_DIR, n);
      if (!force && existsSync(dest)) { skip++; continue; }
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const r = await fetch(RAW + encodeURIComponent(n), { headers: { 'User-Agent': 'godot-theme' } });
          if (!r.ok) throw new Error('http ' + r.status);
          writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
          ok++;
          break;
        } catch (e) {
          if (attempt === 2) fail.push(n);
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
      if ((ok + skip) % 100 === 0) console.log(`  …${ok + skip}/${names.length}`);
    }
  });
  await Promise.all(workers);
  return { ok, skip, fail };
}

const args = process.argv.slice(2);
if (args[0] === '--cats') {
  // Local analysis: distribution + misc list, no network.
  const names = JSON.parse(readFileSync(args[1] || join(root, 'icons', 'names.json'), 'utf8'));
  const cats = {};
  for (const n of names) {
    const c = categorize(n);
    (cats[c] ||= []).push(n);
  }
  for (const [c, list] of Object.entries(cats).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${c}: ${list.length}`);
  }
  if (cats.Misc) console.log('\nMISC:\n' + cats.Misc.join(' '));
  console.log(`\ntotal: ${names.length}, misc: ${(cats.Misc || []).length}`);
} else {
  const force = args.includes('--force');
  console.log('listing remote icons…');
  const names = await listRemote();
  console.log(`found ${names.length} svgs, downloading…`);
  const { ok, skip, fail } = await download(names, force);
  console.log(`done: ${ok} new, ${skip} cached, ${fail.length} failed`);
  if (fail.length) console.log('FAILED: ' + fail.join(' '));
  const order = [...RULES.map((r) => r[0]), 'Misc'];
  const manifest = names.map((n) => ({ n, f: 'godot/' + n, c: categorize(n) }))
    .sort((a, b) => order.indexOf(a.c) - order.indexOf(b.c) || a.n.localeCompare(b.n));
  writeFileSync(MANIFEST, JSON.stringify(manifest));
  const misc = manifest.filter((m) => m.c === 'Misc');
  console.log(`manifest: ${manifest.length} entries, misc: ${misc.length}`);
  if (misc.length) console.log('MISC: ' + misc.map((m) => m.n).join(' '));
}
