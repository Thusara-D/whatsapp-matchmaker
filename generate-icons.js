const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Pink Background
  ctx.fillStyle = '#f43f5e'; // rose-500
  ctx.fillRect(0, 0, size, size);
  
  // White Heart (Simple approximation using two circles and a triangle)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const d = size * 0.6;
  const x = size / 2;
  const y = size / 2 + d * 0.15;
  ctx.arc(x - d * 0.25, y - d * 0.25, d * 0.25, Math.PI, 0, false);
  ctx.arc(x + d * 0.25, y - d * 0.25, d * 0.25, Math.PI, 0, false);
  ctx.lineTo(x, y + d * 0.4);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./public/icons/icon-${size}x${size}.png`, buffer);
}

generateIcon(192);
generateIcon(512);
console.log('Icons generated successfully.');
