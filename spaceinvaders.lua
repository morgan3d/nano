t=0
x=0
y=0
s=9
a={}
r={}
n=90
w="win"
k=19
_:
flip(1)
c=0
for i≤k
 if !a[i]
  u=k*(i//4+1+cos(t))
  ++c
  z=i%4+2
  v=9z+2t
  spr(10+2z,u,v,z)
  if(rnd(n)<.1)r+={x=u,y=v}
  if((u-x+2)²+(v-y)²<k)a[i]=1;y=-5
 end
 m=r[i]
 if m
  spr(9,m.x,m.y,8,8)
  if(k>(m.x-s)²+(m.y-n)² or t>k)e="lose";c=-k
  ++m.y
  if(m.y>128)del(r,m)
 end
end
spr(1,x,y,9)
spr(9,s,n)
t+=.01
s=mid(s+joy.x,k,n)
if(joy.a and y<0)x=s+2;y=n
y-=2
if(c>0)go _
e:
spr("you "+e,64,64)
go e
