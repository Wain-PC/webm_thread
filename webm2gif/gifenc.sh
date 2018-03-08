#!/bin/sh

palette="/tmp/palette.png"
tempwebm="/tmp/temp.gif"

filters="fps=0.2,scale=170:-1:flags=lanczos"
ffmpeg -v warning -i $1 -vf "$filters,palettegen" -y $palette
ffmpeg -v warning -i $1 -i $palette -lavfi "$filters [x]; [x][1:v] paletteuse" -y $tempwebm
#0.2 sec delay between frames
convert -delay 20x100 $tempwebm  $2/$3.gif
