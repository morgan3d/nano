var tests = {
    customRotate:`#nanojam Custom Rotate,3
if ¬τ
  clr=0
  pal(2911121025101307)
  draw(39,3,3,4311)
  small = sprget(0,0,7,7,0)
  big = sprscale(small,2,1)
  cls(0)

rect(screenWidth/2-3.5, screenHeight/2-3.5,screenWidth/2+3.5, screenHeight/2+3.5,29)
line(0,screenHeight/2,screenWidth,screenHeight/2,2)
line(screenWidth/2,0,screenWidth/2,screenHeight)
draw(small, screenWidth/2, screenHeight/2,0,0,π/4)

draw(39, screenWidth/2, screenHeight*3/4,4311,0,π/4)

draw(big,screenWidth/2,screenHeight/4,0,0,π/4)`,
    
    textstyle:`#nanojam textstyle,1
cls(7)
pal(408001307)
text("Normal",32,3,4)
text("Shadow",32,12,954)
text("Outline",32,21,334)
text("Shadow+Outline",32,30,354)

fcn test(x, y, a)
  rect(x,y,x+4,y+6,39)
  pset(x+2,y+3,0)
  text("X",x+2,y+3,4,a)

for u < 3
 for v < 3
  test(10u+20,37+9v,u+4v)`,

    indent: `#nanojam indent,1
for i < 6
  if i > 3
    pset(i,i,i)
  text(i)
`,
    
    IF: `#nanojam IF,1
if (|m.x - a.pos.x| < 3) and (|m.y - a.pos.y| < 3)
 x=1

for x≤1
 if(0)1;if(2)3`,

    WITH: `#nanojam WITH,1
G = {x:1, y:2, z:0}
if 1
 with x,y∈G
  x = 100
  y = 0
  z = 4
text(G.x)
`,

    scope: `#nanojam scope,1
q = 3
z = 0
fcn x()
 extern q
 z = 1
 q = 4

x()
text('' + z + ', ' + q)
`,
    keyrepeat:`#nanojam keyrepeat,1
if ¬τ
 array=[]

for a∊array
 if (++a.y > 64) array.rem(a)
 pset(a.x,a.y,7)

if (joy.aa) array.add(xy(32,0))
`,


    FCN: `#nanojam fcn,1
fcn d()
 for (i<100) pset(64ξ,64ξ,10ξ)
d()`,

    nest: `#nanojam nest,1


if τ≟0
 x=1

if x≟1
 x=2

`,

    flower:`#nanojam Flower,1
clr=12
srand(1)
pal(231507)
fcn T(x,y,θ,L)
 if L>2
  for i<3
   φ=θ+10(ξ-½+⅙cos(τ/100))/L
   u=x+L*cosφ;v=y+L*sinφ
   line(x,y,u,v,1+(L>3)+(L>8))
   T(u,v,φ,⅔L-2ξ)

T(32,64,-½π,25)`,
    
    triangle: `#nanojam triangle,1
θ=τ/100
c=cos(θ);s=sin(θ)
tri(32+20c,32+20s,32-10s,32+15c,20,30, 21)
text(τ)`,
    
    rect:`#nanojam rect,1
rect(10,10,20,30,12)`,

    square:`#nanojam square,1
a=b=1
text(a²+b²)`,
    
    agent:`#nanojam agent
// initialize
if ¬τ
 agents=[];cls(7);cls(7);clr=∅
 for i<30
  agents.add({x:1+2⌊30ξ⌋,y:1+2⌊30ξ⌋,θ:½π⌊4ξ⌋})
  
for a∊agents
 with θ,x,y∊a
  // try turning in each direction while blocked
  for k<2
   j=0
   while ¬pget(x+2cosθ,y+2sinθ) & ++j<4
    θ+=½π(2k-1)

  // remove stuck agents
  if(j≟4)pset(x,y,0);agents.rem(a);cont
 
  // advance
  for(j<2)pset(x+=cosθ,y+=sinθ,0)`,

    FOR: `#nanojam test,1
for 10<x<32
 pset(2x,32)`,

    rain: `#nanojam Rain,1
pal(j=2423221107)
K="εψNπqτ∞∅ξRw0∩∪⌉⊕αβδM5ΔθλμρσφωΩ{1"
for x<13
 h=hash(x+9)
 i=((¼³τ(7h+3)+70h)∩15)-11
 for y<11
  text(K[++j∩31],5x,62-6y,min(i+=½+½h,6))`,
    
    ping: `#nanojam PING
if(¬τ)p=32;f=2⁷
cls(12)
srand(4)
pal(c=40916071415)
J=joy.x
p=mid(3,p+¼J,59)
for x≤4⁵
 draw(91,8x,60,6655)
 k=⌊4ξ+1⌋;u=32x-τ⅒k+32;v=27+22sin(¼τ⅕)
 circ(u,v,8,21);circ(u+2,v-4,2,3)
 pal(c+202k);draw(48+p%2,p,52,5365,2(J<0))
 if(|u-p|+|v-52|<9)f--;if(¬f)wait;τ=0
text(f)`,
    
    sort: `#nanojam Sort,1
a=[1,10,3,5,2]
a.sort()
for i<a.len
 text(a[i],16,6i+2,1)
o=[{y:2,x:2,a:2,t:"b"},{y:1,x:1,a:1,t:"a"},{y:3,x:3,a:3,t:"c"}]
o.sort()
for i<o.len
 text(o[i].a,32,6i+2,1)
o.sort("x")
for i<o.len
 text(o[i].x,48,6i+2,1)
`,
    
    hash: `#nanojam hash,1
for(i<64)line(i,64hash(⅒(i+τ)),i,64,1)`,

    variables: `#nanojam variables,1
a={β:6}
text(a["β"],10,4)
text(a.β,10,12)
text("hi".len,10,20)
text({x:1}.len,10,28)
text({x:1}.keys[0],10,36)`,

    runner: `#nanojam Runner
if(¬τ)clr=y=1;v=0
// background
circ(50,14,8,2)
for(i<64)line(i,20(hash(⌊⅕i+⅕²τ⌋)+1),i,64,3)

// ground height under character
h=50;//hash(⌊τ/64⌋)*32+32
rect(84-τ%96,h,64-τ%96,64,4)

// character
draw(|⅙τ∩3-2|*¬v,20,y-5,1)

// physics
y+=v+=⅒

// on ground
if(y≥h)y=h;v=-2joy.aa`,

    stars:`#nanojam stars,5
if ¬τ
  S=[]
  R=½screenWidth
  for i<4R
    θ=2πξ;v=ξ⁹+⅒
    // radius, speed, dx, dy, color
    S.add([ξR,v*R/480,cosθ,⅗sinθ,gray(2v)])

  // One-frame increment function
  fcn U()
    for s∈S
      // Stretch into lines
      for j<3
        pset(R+s₀s₂,R+s₀s₃,s₄)
        if((s₀+=8s₁sqrt(s₀/R))>2R)s₀=2;s₄=hsv(⅛-½ξ,ξ¹⁵,¼ξ+12s₁)

  // Prime the system
  for (i<9R)U()
  cls(0)

U()`,

    forwith: `#nanojam forwith,1
for (x ∊ b ∊ []) ++x`,
    
    customSprite: `#nanojam custom,5
if ¬τ
  text("Hello",32,3)
  s = sprget(0,0,63,7)
  s = sprscale(s, 4, 2)
  clr=4

draw(s,screenWidth/2,32)`,

    
    textbots:`#nanojam textbots,1
if ¬τ
 A=[];clr=2
 for i≤20
  θ=2πξ
  A.add([63ξ,63ξ,cos(θ),sin(θ),i])

for a∈A
 text(a₄,a₀,a₁,a₄&7)
 a₀=mid(a₀+a₂,-10,74);a₁=mid(a₁+a₃,-10,74)
 if(ξ<⅕²)θ=2πξ;a₂=cos(θ);a₃=sin(θ)`,
    
    rgb: `#nanojam rgb,1
clr=∅
for x<64
 for y<64
  pset(x,y,hsv(x/63,y/63,1,x,y))`,
    
    input:`#nanojam input,1
clr=6
for i<2
 y=30i;j=padᵢ
 circ(44,22+y,4,14+j.a);circ(50,14+y,4,14+j.b)
 circ(30,16+y,2.7,14+j.s)
 line(15,16+y,15+6j.x,16+6j.y+y,1)`,

    starattack: `#nanojam Star Attack
if τ ≟ 0
  y = 32
  // Aliens
  aln = [{x:100, y:10, s:4}, {x:140, y:40, s:20}, {x:180, y:60, s:4}]

// Stars
for s < 64
  // Compute a "random" column on each row
  // for a star, and then cycle it left
  h = hash(s)
  pset(64 - ((64 + ⅓τ) * h % 64), s, gray(⅓h))

y = mid(4, y + joy.y, 60)

// Player ship
draw(38, 10, y, 641)

// alternate animation frames
k = ⌊⅛τ % 2⌋

// Aliens
for a ∈ aln
  draw(a.s + k, a.x, a.y, 645)
  if (a.x - 10)² + (a.y - y)² < 16
    // Hit the ship!
    text("BOOM!", 32, 32, 4)
    show
    wait
    reset
  
  a.x -= 1
  if a.x < -4
    // Pick a new position when off screen
    a.x = 120 + 50ξ
    a.y = 4 + 56ξ`,
    
    spacedash: `#nanojam SPACE DASH
if(¬τ)x=32
// Game-over explosion
if(τ<0)pal(8+3ξ);circ(x,50,99+τ,19);cont

srand(5)
x=mid(9,x+2joy.x,54)
for u≤64
 // Stars
 s=3ξ;pset(u,(2⁸ξ+τs)%2⁸,5+s)
 // Enemy ships
 k=⌊2ξ+1⌋;v=τk-3⁸ξ;draw(5+14k,u,v,324,4);if(|x-u|+|v-50|<6)τ=-99

circ(32,τ-9³,28) // End planet
draw(3,x,50,641) // Player ship

// Victory screen
if(τ≥9³)text("YOU WIN");wait;τ=0`,

    text: `#nanojam text,1
text("\`Hello, World!'", 32, 19, 6)
text("MICE WORLD", 32, 25, 6)
text("AB\\"CZabcz" + "foo", 32, 32, 6)
text("01 2x 39!,.-=+", 32, 38, 6)`,
    
    line: `#nanojam line,1
line(5,20,30,50,3)`,

    circles:`#nanojam circles,1
for i < 4
  for j < 4
     circ(16i + 8, 16j + 8, i + 4j, 1)
`,
    
    clock:`#nanojam clock,1
clr=1
c=31
circ(c,c,c,63)
line(c,c,22cos(⅒²τ)+c,22sin(⅒²τ)+c,4)
line(c,c,28cos(⅒τ)+c,28sin(⅒τ)+c,1)`,
    
    colorgrid: `#nanojam colorgrid,1
for(x<4)for(y<4)i=16x;j=16y;pal(x+4y);rect(i,j,i+15,j+15,1)`,

    sprite:`#nanojam sprite,1
for(x<8)draw(5,3.5,3.5+8x,3462,x,0)
draw(3,31.5,31.5,2345,0,τ/20)`,

    plasma: `#nanojam Plasma,1
clip(0,-12);xform(0,-12)
for y<76
 for x<64
  ψ=y+τ;v=mid(noise(3,⅛²x,⅛²ψ,¼³τ)+½,0,1)
  pset(x,y,hsv(⅗v+½,(1-v)^⅗,v,x,ψ))`,

  triangles: `#nanojam Triangles,3
  xform(0,128,1,-1)
  if ¬τ // Init
   clr = 25
   mtn = []
   for i < 200
    // todo noise
    mtn[i] = 30noise(3,½i) + 30
    
    s = 8
  oldY = mtn[mtn.len - 1]
  for i < mtn.len
   x = i * s; y = mtn[i]
   //tri(x - s, oldY,  x - s, 0,  x, y,   2)
   //tri(x - s, 0,     x, y,      x, 0,  1)
   line(x - s, oldY+20, x,y+20, 3)
   oldY = y
  
  draw(1, 4, 96, 4321)`,

    plasma2:`#nanojam plasma2,1
clr=∅
for y<256
 for x<256
  ψ=y+τ;v=mid(noise(3,⅛²x,⅛²ψ,¼³τ)+½,0,1)
  pset(x,y,hsv(⅗v+½,(1-v)^⅗,v,x,ψ))`,

    manySprites: `#nanojam manySprites,1
clr=∅
for y<32
 for x<32
  draw(19,8x,8y,4321)
`,
    
    nanoBoot:`#nanojam Boot,1
// rainbow
for a<2⁷
 y=max(0,τ-3hash(a)-2⁷)
 pset(cos(a)*y+32,sin(a)*y+32,hsv(⅛y))

// logo
for j<3
 for i<15
  pset(38-i,30+j,([8738,21845,21330]ⱼ▻i∩1)*gray(mid(1-τ/2⁸,0,1)*(τ/20-3|j-1|)))

// erase variables before main program
i=j=a=y=∅;clr=0
`
};
