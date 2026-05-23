import React from 'react'

const iconGrids = {
  strategy: [
    "00111100",
    "01000010",
    "10100001",
    "10011001",
    "10011001",
    "10000101",
    "01000010",
    "00111100"
  ],
  web: [
    "00001000",
    "01001000",
    "10010001",
    "00010010",
    "00100100",
    "01001000",
    "10010001",
    "00010000"
  ],
  mobile: [
    "00111100",
    "01000010",
    "10000001",
    "10000001",
    "10000001",
    "10000001",
    "01011010",
    "00111100"
  ],
  enterprise: [
    "01111110",
    "10000001",
    "01111110",
    "10000001",
    "01111110",
    "10000001",
    "01111110",
    "00000000"
  ],
  ai: [
    "00111100",
    "01111110",
    "11100111",
    "11000011",
    "11000011",
    "11100111",
    "01111110",
    "00111100"
  ],
  cloud: [
    "00011000",
    "00111100",
    "01111110",
    "11111111",
    "11111111",
    "01111110",
    "00000000",
    "00000000"
  ],
  design: [
    "11111111",
    "10000001",
    "10111101",
    "10100101",
    "10100101",
    "10111101",
    "10000001",
    "11111111"
  ],
  marketing: [
    "00000001",
    "00000011",
    "00000111",
    "00001111",
    "00011111",
    "00111111",
    "01111111",
    "11111111"
  ],
  chat: [
    "01111110",
    "11111111",
    "11111111",
    "11111111",
    "11111111",
    "01111110",
    "00011100",
    "00001000"
  ],
  close: [
    "10000001",
    "01000010",
    "00100100",
    "00011000",
    "00011000",
    "00100100",
    "01000010",
    "10000001"
  ],
  send: [
    "00000001",
    "00000011",
    "00000111",
    "00001101",
    "00011001",
    "00110001",
    "01111111",
    "00000011"
  ],
  mail: [
    "00000000",
    "11111111",
    "10000001",
    "10100101",
    "10011001",
    "10000001",
    "11111111",
    "00000000"
  ],
  arrowDownPixel: [
    "00000000",
    "00000000",
    "01000100",
    "00101000",
    "00010000",
    "00000000",
    "00000000",
    "00000000"
  ],
  arrowRightPixel: [
    "00000000",
    "00100000",
    "00010000",
    "10101000",
    "00010000",
    "00100000",
    "00000000",
    "00000000"
  ],
  dotGrid: [
    "10101010",
    "00000000",
    "10101010",
    "00000000",
    "10101010",
    "00000000",
    "10101010",
    "00000000"
  ]
}

export default function DotPixelIcon({ name, size = 32, color = 'currentColor', className = '' }) {
  const grid = iconGrids[name] || iconGrids.web
  const gridWidth = 8
  const gridHeight = 8
  const padding = 1
  const cellWidth = 4
  const cellHeight = 4
  const gap = 1
  
  const width = gridWidth * cellWidth + (gridWidth - 1) * gap + padding * 2
  const height = gridHeight * cellHeight + (gridHeight - 1) * gap + padding * 2

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${width} ${height}`} 
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {grid.map((rowStr, rowIndex) => {
        return rowStr.split('').map((char, colIndex) => {
          if (char === '0') return null
          
          const cx = padding + colIndex * (cellWidth + gap) + cellWidth / 2
          const cy = padding + rowIndex * (cellHeight + gap) + cellHeight / 2
          
          return (
            <circle 
              key={`${rowIndex}-${colIndex}`} 
              cx={cx} 
              cy={cy} 
              r={1.8} 
              fill={color} 
            />
          )
        })
      })}
    </svg>
  )
}
