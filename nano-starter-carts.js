var starterCartArray = [
`#nanojam SPACE DASH
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

// End planet
circ(32,τ-9³,28)

// Player ship
draw(3,x,50,641)

// Victory screen
if(τ≥9³)text("YOU WIN");wait;τ=0`,


`#nanojam Plasma,1
for y<64
 for x<64
  ψ=y+τ;v=mid(noise(3,⅛²x,⅛²ψ,¼³τ)+½,0,1)
  pset(x,y,hsv(⅗v+½,(1-v)^⅗,v,x,ψ))`,

    
`#nanojam Rainbow
clr=12

// Draw a cloud using the
// default palette's white
pal()
circ(10,15,4,1)
circ(14,16,5)
circ(18,12,4)
circ(20,15,4)

// Draw ten rings
for i<10
 // Set color #1 based on the hue
 pal(hsv(i/10,1,1))
 // Draw a disk in this color
 circ(45,68,30-i,1)
 
// Cut the center out using the sky color
pal(12)
circ(45,68,21,1)`,

`#nanojam SNAKE
// by @Jackson_T_Allen
if(¬τ)s=[31,31];θ=0;c=0;e=1
w=64
φ=[cos,sin]
θ+=⅒joy.x
for i≤1
 s.add((s[s.len-2]+φᵢ(θ)+w)%w);if(e≟c)
  s.del(0)
 else
  x=56ξ+4;y=56ξ+4
e=c
text(c)
pset(x,y,8)
for a<3
 for b<3
  for(i<½s.len)circ(s[2i]+w*a-w,s[2i+1]+w*b-w,4,5)
if(|x-s₀|+|y-s₁|<6)c++;
τ%=3⁷`,

`#nanojam Mandelbrot
// Based on code by @Jackson_T_Allen
if(¬τ)x=-½;y=0;s=9
j=joy
x+=j.x/s
y+=j.y/s
s*=1+⅒(j.a-j.b)
for v<64
 for w<64
  α=(w-32)/s+x;β=(v-32)/s+y;a=b=i=0
  while(i++<64&a²+b²<4)c=a²-b²+α;b=2a*b+β;a=c
  pset(w,v,hsv(⅛²i))`
];
