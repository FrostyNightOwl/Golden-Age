(function () {
  "use strict";

  var canvas = document.getElementById("mathCanvas");
  var section = document.getElementById("mathematics");
  if (!canvas || !section || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var mouse = { x: null, y: null };
  var shapes = [];
  var isVisible = false;
  
  // Theme colors
  var colors = {
    light: "rgba(169, 126, 47, 0.15)", // Gold
    dark: "rgba(226, 189, 107, 0.15)", // Bright Gold
    lightActive: "rgba(169, 126, 47, 0.6)",
    darkActive: "rgba(86, 184, 174, 0.8)" // Teal
  };

  function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  // Handle Resize
  function resize() {
    var rect = section.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    initShapes();
  }
  window.addEventListener("resize", resize);

  // Mouse interactivity
  section.addEventListener("mousemove", function(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  section.addEventListener("mouseleave", function() {
    mouse.x = null;
    mouse.y = null;
  });

  class GirihShape {
    constructor(x, y) {
      this.baseX = x;
      this.baseY = y;
      this.x = x;
      this.y = y;
      this.angle = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.005;
      this.size = 40;
      this.activeScale = 1;
    }

    update() {
      this.angle += this.rotationSpeed;
      
      let dist = 1000;
      if (mouse.x !== null && mouse.y !== null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        dist = Math.sqrt(dx * dx + dy * dy);
      }

      // If mouse is near, scale up slightly
      let targetScale = 1;
      if (dist < 150) {
        targetScale = 1 + (150 - dist) / 150 * 0.5;
      }
      this.activeScale += (targetScale - this.activeScale) * 0.1;
      
      this.distToMouse = dist;
    }

    draw() {
      var theme = getCurrentTheme();
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.scale(this.activeScale, this.activeScale);

      // Draw an 8-point star / octagon
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        let a = (i * Math.PI) / 4;
        let r = (i % 2 === 0) ? this.size : this.size * 0.5;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();

      if (this.distToMouse < 150) {
        ctx.strokeStyle = theme === "dark" ? colors.darkActive : colors.lightActive;
        ctx.lineWidth = 1.5;
        // Add a glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
      } else {
        ctx.strokeStyle = theme === "dark" ? colors.dark : colors.light;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      }
      
      ctx.stroke();
      ctx.restore();
    }
  }

  function initShapes() {
    shapes = [];
    let spacing = 120;
    let cols = Math.ceil(canvas.width / spacing) + 1;
    let rows = Math.ceil(canvas.height / spacing) + 1;
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Offset alternate rows for a tighter grid
        let offsetX = (j % 2 === 0) ? 0 : spacing / 2;
        shapes.push(new GirihShape(i * spacing + offsetX, j * spacing));
      }
    }
  }

  function animate() {
    if (!isVisible) return; // Only animate when in view
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < shapes.length; i++) {
      shapes[i].update();
      shapes[i].draw();
    }
    requestAnimationFrame(animate);
  }

  // Intersection Observer to pause animation when off-screen
  var observer = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      if (!isVisible) {
        isVisible = true;
        resize();
        animate();
      }
    } else {
      isVisible = false;
    }
  }, { threshold: 0 });
  
  observer.observe(section);

})();
