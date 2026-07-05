(function () {
  "use strict";

  var canvas = document.getElementById("astroCanvas");
  var section = document.getElementById("astronomy");
  if (!canvas || !section || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var isVisible = false;
  var time = 0;
  var targetTime = 0;
  var lastMouseX = null;
  
  // Theme colors
  var colors = {
    light: "rgba(138, 124, 92, 0.15)", // Faint ink
    dark: "rgba(86, 184, 174, 0.15)", // Faint teal
    lightActive: "rgba(169, 126, 47, 0.8)", // Gold
    darkActive: "rgba(226, 189, 107, 0.8)" // Bright Gold
  };

  function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function resize() {
    var rect = section.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  window.addEventListener("resize", resize);

  section.addEventListener("mousemove", function(e) {
    if (lastMouseX !== null) {
      var dx = e.clientX - lastMouseX;
      targetTime += dx * 0.02; // Mouse movement spins time
    }
    lastMouseX = e.clientX;
  });

  section.addEventListener("mouseleave", function() {
    lastMouseX = null;
  });

  class TusiCouple {
    constructor(x, y, R, speedMultiplier) {
      this.x = x;
      this.y = y;
      this.R = R; // Radius of large circle
      this.r = R / 2; // Radius of small circle (always half)
      this.speed = speedMultiplier;
    }

    draw(t) {
      var theme = getCurrentTheme();
      let angle = t * this.speed;
      
      ctx.save();
      ctx.translate(this.x, this.y);

      // Draw large circle
      ctx.beginPath();
      ctx.arc(0, 0, this.R, 0, Math.PI * 2);
      ctx.strokeStyle = theme === "dark" ? colors.dark : colors.light;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Calculate position of small circle
      let smallCenterX = (this.R - this.r) * Math.cos(angle);
      let smallCenterY = (this.R - this.r) * Math.sin(angle);

      // Draw small circle
      ctx.beginPath();
      ctx.arc(smallCenterX, smallCenterY, this.r, 0, Math.PI * 2);
      ctx.stroke();

      // The point on the small circle (which draws the straight line)
      // Rotates in opposite direction at twice the speed relative to small center
      let pointAngle = -angle; 
      let pointX = smallCenterX + this.r * Math.cos(pointAngle);
      let pointY = smallCenterY + this.r * Math.sin(pointAngle);

      // Draw straight line path
      ctx.beginPath();
      ctx.moveTo(-this.R, 0);
      ctx.lineTo(this.R, 0);
      ctx.setLineDash([5, 10]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw the tracing point
      ctx.beginPath();
      ctx.arc(pointX, pointY, 4, 0, Math.PI * 2);
      ctx.fillStyle = theme === "dark" ? colors.darkActive : colors.lightActive;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
      
      // Draw line from center to small circle center to point
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(smallCenterX, smallCenterY);
      ctx.lineTo(pointX, pointY);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  var couples = [];

  function animate() {
    if (!isVisible) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Auto-spin slowly, but allow mouse to override
    targetTime += 0.005;
    time += (targetTime - time) * 0.1;

    if (couples.length === 0) {
      // Initialize if empty (depends on canvas size)
      let R = Math.min(canvas.width, canvas.height) * 0.3;
      couples.push(new TusiCouple(canvas.width * 0.2, canvas.height * 0.5, R * 0.6, 1));
      couples.push(new TusiCouple(canvas.width * 0.8, canvas.height * 0.5, R * 0.8, -0.7));
      couples.push(new TusiCouple(canvas.width * 0.5, canvas.height * 0.5, R, 0.5));
    }

    for (let i = 0; i < couples.length; i++) {
      couples[i].draw(time);
    }
    
    requestAnimationFrame(animate);
  }

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
