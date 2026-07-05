(function () {
  "use strict";

  // Only run if canvas is supported and hero exists
  var canvas = document.getElementById("heroCanvas");
  var hero = document.querySelector(".hero");
  if (!canvas || !hero || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var particles = [];
  var mouse = { x: null, y: null, radius: 150 };
  var clickPulse = 0; // For supernova effect

  // Color palettes based on theme
  var themes = {
    light: {
      particleColors: ["#a97e2f", "#8a7c5c", "#5c5138"],
      lineColor: "138, 124, 92" // #8a7c5c in RGB for opacity manipulation
    },
    dark: {
      particleColors: ["#e2bd6b", "#56b8ae", "#d5a94e"],
      lineColor: "213, 169, 78" // #d5a94e in RGB
    }
  };

  function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? themes.dark : themes.light;
  }

  // Handle Resize
  function resize() {
    var rect = hero.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    initParticles();
  }
  window.addEventListener("resize", resize);

  // Mouse interactivity
  hero.addEventListener("mousemove", function(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  hero.addEventListener("mouseleave", function() {
    mouse.x = null;
    mouse.y = null;
  });

  // Supernova on click
  hero.addEventListener("mousedown", function(e) {
    clickPulse = 600; // Radius of the explosion force
  });

  // Particle Class
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
      this.radius = Math.random() * 2 + 0.5;
      this.baseColor = "";
      this.assignColor();
    }

    assignColor() {
      var theme = getCurrentTheme();
      this.baseColor = theme.particleColors[Math.floor(Math.random() * theme.particleColors.length)];
    }

    update() {
      // Move
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

      // Mouse Repulsion Force
      if (mouse.x != null && mouse.y != null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Standard hover repel
        if (distance < mouse.radius) {
          let force = (mouse.radius - distance) / mouse.radius;
          let forceX = dx / distance;
          let forceY = dy / distance;
          this.x -= forceX * force * 3;
          this.y -= forceY * force * 3;
        }

        // Supernova explosion force
        if (clickPulse > 0 && distance < clickPulse) {
          let force = (clickPulse - distance) / clickPulse;
          // Exponential force for punchier explosion
          force = force * force; 
          let forceX = dx / distance;
          let forceY = dy / distance;
          this.vx -= forceX * force * 20;
          this.vy -= forceY * force * 20;
        }
      }

      // Add a bit of friction so they calm down after a supernova
      if (Math.abs(this.vx) > 1) this.vx *= 0.95;
      if (Math.abs(this.vy) > 1) this.vy *= 0.95;
      
      // Ensure they don't stop completely
      if (Math.abs(this.vx) < 0.2) this.vx += (Math.random() - 0.5) * 0.1;
      if (Math.abs(this.vy) < 0.2) this.vy += (Math.random() - 0.5) * 0.1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.baseColor;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    // Number of particles based on screen area to maintain performance
    let numberOfParticles = Math.floor((canvas.width * canvas.height) / 4000);
    // Cap at a reasonable number
    if (numberOfParticles > 500) numberOfParticles = 500;
    
    for (let i = 0; i < numberOfParticles; i++) {
      particles.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reduce clickPulse over time
    if (clickPulse > 0) clickPulse -= 10;

    let theme = getCurrentTheme();

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      // Connect particles with lines
      for (let j = i; j < particles.length; j++) {
        let dx = particles[i].x - particles[j].x;
        let dy = particles[i].y - particles[j].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          // Line opacity based on distance
          let opacity = 1 - (distance / 120);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${theme.lineColor}, ${opacity * 0.4})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  // Listen for theme toggle to update particle colors
  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function() {
      // Add a slight delay to allow the HTML data-theme attribute to update
      setTimeout(function() {
        particles.forEach(p => p.assignColor());
      }, 10);
    });
  }

  // Initial setup
  resize(); // Calls initParticles()
  animate();

})();
