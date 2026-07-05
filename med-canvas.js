(function () {
  "use strict";

  var canvas = document.getElementById("medCanvas");
  var section = document.getElementById("medicine");
  if (!canvas || !section || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var isVisible = false;
  var nodes = [];
  var pulses = [];
  var mouse = { x: null, y: null };
  
  // Theme colors
  var colors = {
    light: "rgba(138, 51, 36, 0.2)", // Faint red/rubric
    dark: "rgba(211, 128, 95, 0.2)", // Faint rubric
    lightPulse: "rgba(138, 51, 36, 0.8)",
    darkPulse: "rgba(211, 128, 95, 0.8)"
  };

  function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function resize() {
    var rect = section.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    initNetwork();
  }
  window.addEventListener("resize", resize);

  section.addEventListener("mousemove", function(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  section.addEventListener("mouseleave", function() {
    mouse.x = null;
    mouse.y = null;
  });

  // Create a mesh of nodes
  function initNetwork() {
    nodes = [];
    pulses = [];
    let numNodes = Math.floor((canvas.width * canvas.height) / 8000);
    if (numNodes > 150) numNodes = 150;
    
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        connections: []
      });
    }

    // Connect close nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[i].x - nodes[j].x;
        let dy = nodes[i].y - nodes[j].y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        // Connect if close enough, but limit max connections to create branching
        if (dist < 150 && nodes[i].connections.length < 3 && nodes[j].connections.length < 3) {
          nodes[i].connections.push(nodes[j]);
          nodes[j].connections.push(nodes[i]);
        }
      }
    }
  }

  class Pulse {
    constructor() {
      this.currentNode = nodes[Math.floor(Math.random() * nodes.length)];
      this.targetNode = this.getRandomConnection(this.currentNode) || this.currentNode;
      this.progress = 0; // 0 to 1
      this.speed = Math.random() * 0.01 + 0.005;
    }

    getRandomConnection(node) {
      if (node.connections.length === 0) return null;
      return node.connections[Math.floor(Math.random() * node.connections.length)];
    }

    update() {
      if (this.currentNode === this.targetNode) {
        this.targetNode = this.getRandomConnection(this.currentNode) || nodes[Math.floor(Math.random() * nodes.length)];
        this.progress = 0;
      }

      this.progress += this.speed;

      // Mouse attraction modifies progress if near
      let currentX = this.currentNode.x + (this.targetNode.x - this.currentNode.x) * this.progress;
      let currentY = this.currentNode.y + (this.targetNode.y - this.currentNode.y) * this.progress;

      if (mouse.x !== null && mouse.y !== null) {
        let dx = mouse.x - currentX;
        let dy = mouse.y - currentY;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          this.speed += 0.001; // Speed up towards mouse
          if (this.speed > 0.03) this.speed = 0.03;
        } else {
          this.speed -= 0.001;
          if (this.speed < 0.005) this.speed = 0.005;
        }
      }

      if (this.progress >= 1) {
        this.currentNode = this.targetNode;
        this.targetNode = this.getRandomConnection(this.currentNode) || nodes[Math.floor(Math.random() * nodes.length)];
        this.progress = 0;
      }
    }

    draw() {
      var theme = getCurrentTheme();
      let currentX = this.currentNode.x + (this.targetNode.x - this.currentNode.x) * this.progress;
      let currentY = this.currentNode.y + (this.targetNode.y - this.currentNode.y) * this.progress;

      ctx.beginPath();
      ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
      ctx.fillStyle = theme === "dark" ? colors.darkPulse : colors.lightPulse;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
    }
  }

  function animate() {
    if (!isVisible) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var theme = getCurrentTheme();

    // Draw network
    ctx.strokeStyle = theme === "dark" ? colors.dark : colors.light;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    
    ctx.beginPath();
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes[i].connections.length; j++) {
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[i].connections[j].x, nodes[i].connections[j].y);
      }
    }
    ctx.stroke();

    // Generate pulses if needed
    if (pulses.length < nodes.length / 3 && Math.random() < 0.1) {
      pulses.push(new Pulse());
    }

    // Update and draw pulses
    for (let i = 0; i < pulses.length; i++) {
      pulses[i].update();
      pulses[i].draw();
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
