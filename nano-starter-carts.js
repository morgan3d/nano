var starterCartArray = [
    // First cart becomes the program shown on start
`#nanojam Star Attack
if τ ≟ 0
  y = 32
  // Aliens
  aln = [{x:100, y:10, s:4}, {x:140, y:40, s:20}, {x:180, y:60, s:4}]

// Stars
for s < 64
  // Compute a "random" column on each row
  // for a star, and then cycle it left
  h = hash(s)
  pset(64 - ((64 + τ) * h % 64), s, gray(⅓h))

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


`#nanojam Space Dash
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

`#nanojam Breaker

if ¬τ
  // initialize variables
  clr = 5
  cls(5)
  pal(311121004311307)
  clip(0, -12, 63, 63)
  paddle = {pos: xy(32, 54), ext: xy(6, 1)}
  ball   = {pos: xy(32, 50), ext: xy(2, 2), vel: xy(-1,-1)}
  lives = 3
  world = []
  for j < 4
    for i < 8
      world.add({pos: xy(8i + 3, 4j + 8), ext: xy(4, 2)})

// overlap size for brick hit
let W = world₀.ext.x + ball.ext.x
let H = world₀.ext.y + ball.ext.y

// current and next ball position
let cur = ball.pos
let nxt = xy(cur.x + ball.vel.x, cur.y + ball.vel.y)

///////////////////////////////////////////////////////
// draw lives
rect(0,-12,63,-5,8)
text("Breaker",14,-8,7)
for (L < lives) draw(27, 60 - 5L, -8, 79) 

///////////////////////////////////////////////////////
// background line graphics
for i < 10
  line(0, 32 + 48noise(4, τ/300, i), 63, 32 + 48noise(4, τ/300, 2, i), 3)

//////////////////////////////////////////////////
// bricks
for brick ∊ world
  with pos, ext ∊ brick
    with x, y ∊ pos
      draw(44, x, y, 4251)
  
      // Look for ball collisions
      if (|x - nxt.x| < W) and (|y - cur.y| < H)
        // Hit horizontally
        world.rem(brick); sound(25)
        ball.vel.x *= -1
      elif (|x - cur.x| < W) and (|y - nxt.y| < H)
        // Hit vertically
        world.rem(brick); sound(25)
        ball.vel.y *= -1
   
//////////////////////////////////////////////////
// paddle
with pos, ext ∊ paddle
  with x, y ∊ pos
    line(x - ext.x, y + ext.y + 1, x + ext.x, y + ext.y + 1, 8)
    rect(x - ext.x, y - ext.y, x + ext.x, y + ext.y, 7)
    x = mid(x + joy.x, ext.x, 63 - ext.x) 
  
//////////////////////////////////////////////////
// ball
with pos, ext, vel ∊ ball
  draw(43, pos.x, pos.y, 192)
  pos.x += vel.x; pos.y += vel.y

  // bounce x
  diff = pos.x - 32
  if |diff| > 32 - ext.x
    vel.x *= -sgn(diff * vel.x); sound(61)

  // bounce y
  if pos.y - ext.y < 0
    vel.y = |vel.y|; sound(61)
  
  // lose ball
  if pos.y + ext.y > 70
    vel.x = +1; vel.y = -1
    pos.x = paddle.pos.x
    pos.y = paddle.pos.y - paddle.ext.y - ball.ext.y
    lives -= 1
    draw(27, 60 - 5lives, -8, 89); pset(7)
    if lives ≥ 0   
      sound(79); text("Press to Launch")
      wait
    else
      sound(28); text("GAME OVER")
      wait; reset
  
  if overlap(ball, paddle) and vel.y > 0
    vel.y *= -1; sound(61)

//////////////////////////////////////////////////
// end game
if world.len ≟ 0
  sound(75); text("You Win", 32, 32)
  wait; reset
 
if (¬τ) text("Press to Launch"); wait`,

    
    
`#nanojam Colours,1
for y < 64
  for x < 64
    hue = x / 64
    sat = y / 32
    val = 2 - y / 32
    pset(x, y, hsv(hue, sat, val, x, y))`,

    
`#nanojam Plasma,1
for y<64
  for x<64
    ψ = y + τ
    v = mid(noise(3, ⅛²x, ⅛²ψ, ¼³τ) + ½, 0, 1)
    pset(x, y, hsv(⅗v+½, (1-v)^⅗, v, x, ψ))`,

    
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

`#nanojam TweetPong
// Ball = (u,v)
// Velocity = (z,w)
// Score = s
// Player = x

// Reset
if(¬τ)u=v=32;s=[0,0];x=[u,u];z=½;w=¼

for i<2
 b=2(½-i);y=25b+32
 // Paddle and score
 draw(44,xᵢ=mid(3,xᵢ+padᵢ.x,59),y,1);text(sᵢ,4,y)
 // Paddle bounce
 if(|y-v|<2&|xᵢ-u|<4)w=-¼b
 // Score
 if(v*b>y*b)++s₁₋ᵢ;u=v=32

// Line
for(i<8)draw(91,8i,32,91)

// Ball
draw(43,u+=z,v+=w,9191)

// Wall bounce
if(u>64)z=-½
if(u<0)z=½`,

`#nanojam Pong

if τ ≟ 0
 // Initialize the game
 // ball position and velocity
 ball = xy(32, 32)
 vel  = xy(½, ¼)
 
 // Per-player variables
 dir = [+1, -1]
 score = [0, 0] 
 paddle = [32, 32]

// For each player
for i < 2
 // Move the paddle
 paddleᵢ = mid(3, paddleᵢ + padᵢ.x, 59)

 // Paddle y position
 y = 25dirᵢ + 32 
 
 // Draw the paddle and score
 draw(44, paddleᵢ, y, 1)
 text(scoreᵢ, 4, y)

 // Paddle bounce
 if |paddleᵢ - ball.x| < 4 & |y - ball.y| < 2
  sound(34)
  vel.y = -¼dirᵢ

 // Ball goes past paddle. Multiply both sides by
 // +1 or -1 to alternate the sign of the comparison.
 if ball.y * dirᵢ > y * dirᵢ
  // The other player scores
  sound(32)
  ++score₁₋ᵢ
  ball.x = ball.y = 32
  
// Draw the center line
for (i < 8) draw(91, 8i, 32, 91)

// Ball physics. Assume the ball moves slowly.
ball.x += vel.x; ball.y += vel.y
if |ball.x - 32| > 30
 vel.x = -vel.x
 sound(61)

// Draw the ball
draw(43, ball.x, ball.y, 9191)`,


    
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
