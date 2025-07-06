# LiDAV – Line Drawing Algorithms Visualizer

**LiDAV** (Line Drawing Algorithms Visualizer) is a web-based tool to visualize and step through classic computer graphics algorithms like **DDA** and **Bresenham's Line Drawing Algorithm** on a pixel grid.

This project is designed to be interactive, educational, and accessible. It allows users to see how each algorithm computes line pixels step-by-step with explanations, plots, and calculations.

---

## Live Demo

View the project here: [https://ArjunSajith.github.io/LiDAV](https://ArjunSajith.github.io/LiDAV)

---

## Features

- Step-by-step visualization of DDA and Bresenham algorithms  
- Interactive grid-based canvas with pan and zoom  
- Manual or clickable coordinate input  
- Real-time increment and error calculations  
- Dynamic step-by-step explanations  
- Table view of all plotted points  
- Entirely frontend-based – no installation needed  

---

## How to Use

### Option 1: GitHub Pages (Recommended)

1. Visit the [Live Demo](https://ArjunSajith.github.io/LiDAV)  
2. Select an algorithm  
3. Click two points on the grid or input them manually  
4. Click **Next** to reveal line pixels step-by-step  
5. View detailed explanations and calculations  
6. Use **Show Table** to display the full steps  
7. Click **Reset** to start again  

### Option 2: Run Locally

```
bash
git clone https://github.com/your-username/LiDAV.git
cd LiDAV
python3 -m http.server
```

## Open http://localhost:8000 in your browser

## Project Structure
```
LiDAV/
├── index.html
├── static/
│   ├── js/
│   │   ├── sketch.js
│   │   └── algorithms.js
│   └── css/
│       └── style.css
├── .gitignore
└── README.md
```

## Technologies Used
- HTML / CSS / JavaScript
- p5.js for canvas rendering
- Vanilla JavaScript for DOM handling and logic

## License
This project is licensed under the MIT License.