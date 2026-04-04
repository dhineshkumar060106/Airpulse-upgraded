// ============================================================
//  AIRSENSE — 3D GLOBE MODULE
//  Three.js interactive globe with country AQI data
// ============================================================

(function() {
  const COUNTRY_AQI_DATA = {
    "China": { aqi: 168, pm25: 78, pm10: 120, no2: 45, co: 2.8, o3: 62, status: "Unhealthy" },
    "India": { aqi: 185, pm25: 92, pm10: 145, no2: 52, co: 3.1, o3: 55, status: "Unhealthy" },
    "USA": { aqi: 48, pm25: 12, pm10: 22, no2: 18, co: 0.8, o3: 38, status: "Good" },
    "Russia": { aqi: 62, pm25: 18, pm10: 35, no2: 22, co: 1.1, o3: 42, status: "Moderate" },
    "Brazil": { aqi: 54, pm25: 15, pm10: 28, no2: 16, co: 0.9, o3: 44, status: "Moderate" },
    "Australia": { aqi: 28, pm25: 7, pm10: 14, no2: 10, co: 0.4, o3: 30, status: "Good" },
    "Canada": { aqi: 33, pm25: 8, pm10: 16, no2: 12, co: 0.5, o3: 32, status: "Good" },
    "Germany": { aqi: 45, pm25: 11, pm10: 21, no2: 28, co: 0.7, o3: 36, status: "Good" },
    "UK": { aqi: 42, pm25: 10, pm10: 19, no2: 25, co: 0.6, o3: 34, status: "Good" },
    "France": { aqi: 47, pm25: 12, pm10: 22, no2: 26, co: 0.7, o3: 37, status: "Good" },
    "Japan": { aqi: 58, pm25: 16, pm10: 30, no2: 30, co: 1.0, o3: 45, status: "Moderate" },
    "South Korea": { aqi: 75, pm25: 24, pm10: 48, no2: 35, co: 1.4, o3: 48, status: "Moderate" },
    "Pakistan": { aqi: 192, pm25: 98, pm10: 155, no2: 56, co: 3.4, o3: 52, status: "Unhealthy" },
    "Bangladesh": { aqi: 178, pm25: 88, pm10: 140, no2: 50, co: 3.0, o3: 48, status: "Unhealthy" },
    "Indonesia": { aqi: 82, pm25: 26, pm10: 52, no2: 28, co: 1.5, o3: 46, status: "Moderate" },
    "Mexico": { aqi: 88, pm25: 28, pm10: 55, no2: 32, co: 1.6, o3: 58, status: "Moderate" },
    "South Africa": { aqi: 65, pm25: 19, pm10: 38, no2: 24, co: 1.2, o3: 44, status: "Moderate" },
    "Nigeria": { aqi: 112, pm25: 42, pm10: 72, no2: 36, co: 2.0, o3: 50, status: "Unhealthy for Sensitive Groups" },
    "Egypt": { aqi: 135, pm25: 58, pm10: 95, no2: 42, co: 2.5, o3: 55, status: "Unhealthy for Sensitive Groups" },
    "Saudi Arabia": { aqi: 98, pm25: 35, pm10: 75, no2: 30, co: 1.8, o3: 52, status: "Moderate" },
    "Iran": { aqi: 122, pm25: 50, pm10: 82, no2: 38, co: 2.2, o3: 53, status: "Unhealthy for Sensitive Groups" },
    "Turkey": { aqi: 78, pm25: 25, pm10: 50, no2: 34, co: 1.4, o3: 47, status: "Moderate" },
    "Argentina": { aqi: 44, pm25: 11, pm10: 21, no2: 15, co: 0.7, o3: 35, status: "Good" },
    "Colombia": { aqi: 56, pm25: 16, pm10: 30, no2: 20, co: 1.0, o3: 42, status: "Moderate" },
    "Thailand": { aqi: 95, pm25: 32, pm10: 62, no2: 35, co: 1.7, o3: 50, status: "Moderate" },
    "Vietnam": { aqi: 108, pm25: 40, pm10: 68, no2: 38, co: 1.9, o3: 52, status: "Unhealthy for Sensitive Groups" },
    "Philippines": { aqi: 85, pm25: 27, pm10: 54, no2: 30, co: 1.5, o3: 47, status: "Moderate" },
    "Sweden": { aqi: 22, pm25: 5, pm10: 10, no2: 8, co: 0.3, o3: 28, status: "Good" },
    "Norway": { aqi: 18, pm25: 4, pm10: 8, no2: 7, co: 0.2, o3: 26, status: "Good" },
    "New Zealand": { aqi: 20, pm25: 5, pm10: 9, no2: 8, co: 0.3, o3: 28, status: "Good" },
    "Poland": { aqi: 88, pm25: 30, pm10: 58, no2: 32, co: 1.6, o3: 45, status: "Moderate" },
    "Ukraine": { aqi: 72, pm25: 22, pm10: 44, no2: 28, co: 1.3, o3: 43, status: "Moderate" },
    "Iraq": { aqi: 145, pm25: 62, pm10: 105, no2: 44, co: 2.6, o3: 58, status: "Unhealthy for Sensitive Groups" },
    "Ethiopia": { aqi: 90, pm25: 30, pm10: 60, no2: 28, co: 1.6, o3: 46, status: "Moderate" },
    "Kenya": { aqi: 68, pm25: 20, pm10: 40, no2: 24, co: 1.2, o3: 44, status: "Moderate" },
    "Morocco": { aqi: 82, pm25: 26, pm10: 54, no2: 30, co: 1.5, o3: 47, status: "Moderate" },
    "Chile": { aqi: 55, pm25: 16, pm10: 30, no2: 18, co: 0.9, o3: 40, status: "Moderate" },
    "Peru": { aqi: 60, pm25: 18, pm10: 36, no2: 22, co: 1.1, o3: 42, status: "Moderate" },
    "Uzbekistan": { aqi: 155, pm25: 68, pm10: 112, no2: 46, co: 2.7, o3: 60, status: "Unhealthy" },
    "Kazakhstan": { aqi: 95, pm25: 33, pm10: 65, no2: 32, co: 1.7, o3: 48, status: "Moderate" },
    "Mongolia": { aqi: 178, pm25: 85, pm10: 138, no2: 48, co: 2.9, o3: 50, status: "Unhealthy" },
    "Myanmar": { aqi: 102, pm25: 38, pm10: 65, no2: 36, co: 1.8, o3: 51, status: "Unhealthy for Sensitive Groups" },
    "Nepal": { aqi: 168, pm25: 78, pm10: 128, no2: 48, co: 2.8, o3: 54, status: "Unhealthy" },
    "Sri Lanka": { aqi: 78, pm25: 24, pm10: 48, no2: 28, co: 1.4, o3: 46, status: "Moderate" },
    "Ghana": { aqi: 95, pm25: 32, pm10: 62, no2: 32, co: 1.7, o3: 48, status: "Moderate" },
    "Cuba": { aqi: 48, pm25: 13, pm10: 24, no2: 18, co: 0.8, o3: 38, status: "Good" },
    "Spain": { aqi: 52, pm25: 14, pm10: 26, no2: 30, co: 0.8, o3: 40, status: "Moderate" },
    "Italy": { aqi: 60, pm25: 18, pm10: 34, no2: 32, co: 1.0, o3: 44, status: "Moderate" },
    "Greece": { aqi: 58, pm25: 17, pm10: 32, no2: 28, co: 0.9, o3: 42, status: "Moderate" },
    "Portugal": { aqi: 44, pm25: 11, pm10: 21, no2: 24, co: 0.7, o3: 36, status: "Good" },
    "Netherlands": { aqi: 50, pm25: 13, pm10: 24, no2: 32, co: 0.8, o3: 38, status: "Moderate" }
  };

  function getAQIColor(aqi) {
    if (aqi <= 50)  return { r: 0.0, g: 0.89, b: 0.0 };
    if (aqi <= 100) return { r: 0.96, g: 0.82, b: 0.0 };
    if (aqi <= 150) return { r: 1.0,  g: 0.49, b: 0.0 };
    if (aqi <= 200) return { r: 1.0,  g: 0.17, b: 0.17 };
    if (aqi <= 300) return { r: 0.56, g: 0.24, b: 0.59 };
    return { r: 0.49, g: 0.0, b: 0.14 };
  }

  function latLonToVec3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
       radius * Math.cos(phi),
       radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Country approximate center coordinates
  const COUNTRY_COORDS = {
    "China":        { lat: 35.86, lon: 104.19 },
    "India":        { lat: 20.59, lon: 78.96 },
    "USA":          { lat: 37.09, lon: -95.71 },
    "Russia":       { lat: 61.52, lon: 105.31 },
    "Brazil":       { lat: -14.24, lon: -51.93 },
    "Australia":    { lat: -25.27, lon: 133.77 },
    "Canada":       { lat: 56.13, lon: -106.35 },
    "Germany":      { lat: 51.17, lon: 10.45 },
    "UK":           { lat: 55.37, lon: -3.43 },
    "France":       { lat: 46.23, lon: 2.21 },
    "Japan":        { lat: 36.20, lon: 138.25 },
    "South Korea":  { lat: 35.91, lon: 127.77 },
    "Pakistan":     { lat: 30.38, lon: 69.35 },
    "Bangladesh":   { lat: 23.68, lon: 90.36 },
    "Indonesia":    { lat: -0.79, lon: 113.92 },
    "Mexico":       { lat: 23.63, lon: -102.55 },
    "South Africa": { lat: -30.56, lon: 22.94 },
    "Nigeria":      { lat: 9.08, lon: 8.68 },
    "Egypt":        { lat: 26.82, lon: 30.80 },
    "Saudi Arabia": { lat: 23.89, lon: 45.08 },
    "Iran":         { lat: 32.43, lon: 53.69 },
    "Turkey":       { lat: 38.96, lon: 35.24 },
    "Argentina":    { lat: -38.42, lon: -63.62 },
    "Colombia":     { lat: 4.57, lon: -74.30 },
    "Thailand":     { lat: 15.87, lon: 100.99 },
    "Vietnam":      { lat: 14.06, lon: 108.28 },
    "Philippines":  { lat: 12.88, lon: 121.77 },
    "Sweden":       { lat: 60.13, lon: 18.64 },
    "Norway":       { lat: 60.47, lon: 8.47 },
    "New Zealand":  { lat: -40.90, lon: 174.89 },
    "Poland":       { lat: 51.92, lon: 19.14 },
    "Ukraine":      { lat: 48.38, lon: 31.17 },
    "Iraq":         { lat: 33.22, lon: 43.68 },
    "Ethiopia":     { lat: 9.15, lon: 40.49 },
    "Kenya":        { lat: -0.02, lon: 37.91 },
    "Morocco":      { lat: 31.79, lon: -7.09 },
    "Chile":        { lat: -35.68, lon: -71.54 },
    "Peru":         { lat: -9.19, lon: -75.02 },
    "Uzbekistan":   { lat: 41.38, lon: 64.59 },
    "Kazakhstan":   { lat: 48.02, lon: 66.92 },
    "Mongolia":     { lat: 46.86, lon: 103.85 },
    "Myanmar":      { lat: 21.92, lon: 95.96 },
    "Nepal":        { lat: 28.39, lon: 84.12 },
    "Sri Lanka":    { lat: 7.87, lon: 80.77 },
    "Ghana":        { lat: 7.95, lon: -1.02 },
    "Cuba":         { lat: 21.52, lon: -77.78 },
    "Spain":        { lat: 40.46, lon: -3.75 },
    "Italy":        { lat: 41.87, lon: 12.57 },
    "Greece":       { lat: 39.07, lon: 21.82 },
    "Portugal":     { lat: 39.40, lon: -8.22 },
    "Netherlands":  { lat: 52.13, lon: 5.29 }
  };

  function initGlobe() {
    const canvas = document.getElementById('globeCanvas');
    if (!canvas) return;

    const W = canvas.parentElement.clientWidth;
    const H = 600;
    canvas.width = W;
    canvas.height = H;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 3);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x112233, 1.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x00dcc8, 2.0);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0x0066ff, 0.8);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // Globe base sphere
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x071820,
      emissive: 0x001a24,
      emissiveIntensity: 0.4,
      shininess: 20,
      transparent: true,
      opacity: 0.98,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Globe wireframe overlay
    const wireGeo = new THREE.SphereGeometry(1.001, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00dcc8,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    scene.add(new THREE.Mesh(wireGeo, wireMat));

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(1.08, 64, 64);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x00dcc8,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Draw latitude/longitude grid lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00dcc8, transparent: true, opacity: 0.08 });
    for (let lat = -80; lat <= 80; lat += 20) {
      const pts = [];
      for (let lon = -180; lon <= 180; lon += 2) pts.push(latLonToVec3(lat, lon, 1.002));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }
    for (let lon = -180; lon <= 180; lon += 20) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 2) pts.push(latLonToVec3(lat, lon, 1.002));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }

    // Country dots
    const dotObjects = [];
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.04 };

    const dotPositions = [];
    const dotColors = [];
    const dotCountries = [];

    Object.entries(COUNTRY_COORDS).forEach(([country, { lat, lon }]) => {
      const data = COUNTRY_AQI_DATA[country];
      if (!data) return;
      const pos = latLonToVec3(lat, lon, 1.015);
      dotPositions.push(pos.x, pos.y, pos.z);
      const c = getAQIColor(data.aqi);
      dotColors.push(c.r, c.g, c.b);
      dotCountries.push(country);
    });

    const dotsGeo = new THREE.BufferGeometry();
    dotsGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    dotsGeo.setAttribute('color', new THREE.Float32BufferAttribute(dotColors, 3));
    const dotsMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    const dots = new THREE.Points(dotsGeo, dotsMat);
    scene.add(dots);
    dotObjects.push({ mesh: dots, countries: dotCountries });

    // Ring pulse for hover
    const ringGeo = new THREE.RingGeometry(0.02, 0.035, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    // Mouse / drag state
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotVel = { x: 0, y: 0 };
    let hoverCountry = null;

    const tooltip = document.getElementById('globeTooltip');
    const tooltipCountry = document.getElementById('tooltipCountry');
    const tooltipAQI = document.getElementById('tooltipAQI');
    const tooltipStatus = document.getElementById('tooltipStatus');
    const tooltipPollutants = document.getElementById('tooltipPollutants');

    function updateTooltip(country) {
      if (!country || !COUNTRY_AQI_DATA[country]) {
        tooltip.classList.remove('visible');
        ring.material.opacity = 0;
        return;
      }
      const d = COUNTRY_AQI_DATA[country];
      const c = getAQIColor(d.aqi);
      tooltipCountry.textContent = country;
      tooltipAQI.textContent = d.aqi;
      tooltipAQI.style.color = `rgb(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)})`;
      tooltipStatus.textContent = d.status;
      tooltipPollutants.innerHTML = `
        <span class="tp">PM2.5: ${d.pm25}</span>
        <span class="tp">PM10: ${d.pm10}</span>
        <span class="tp">NO₂: ${d.no2}</span>
        <span class="tp">CO: ${d.co}</span>
        <span class="tp">O₃: ${d.o3}</span>
      `;
      tooltip.classList.add('visible');
    }

    canvas.addEventListener('mousedown', e => {
      isDragging = false;
      prevMouse = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
      canvas._startMouseMove = false;
    });

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;

      if (e.buttons === 1) {
        isDragging = true;
        rotVel.y = dx * 0.004;
        rotVel.x = dy * 0.004;
        globe.rotation.y += rotVel.y;
        globe.rotation.x = Math.max(-0.6, Math.min(0.6, globe.rotation.x + rotVel.x));
        dots.rotation.copy(globe.rotation);
        prevMouse = { x: e.clientX, y: e.clientY };
      } else {
        // Hover detection
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(dots);
        if (intersects.length > 0) {
          const idx = intersects[0].index;
          const country = dotCountries[idx];
          if (country !== hoverCountry) {
            hoverCountry = country;
            updateTooltip(country);
            const pos = latLonToVec3(COUNTRY_COORDS[country].lat, COUNTRY_COORDS[country].lon, 1.02);
            // Rotate ring to face camera
            ring.position.copy(pos);
            ring.lookAt(new THREE.Vector3(0, 0, 3));
            ring.material.opacity = 0.8;
            ring.material.color.setHex(
              (() => {
                const d = COUNTRY_AQI_DATA[country];
                const c = getAQIColor(d.aqi);
                return (Math.round(c.r * 255) << 16) | (Math.round(c.g * 255) << 8) | Math.round(c.b * 255);
              })()
            );
          }
          canvas.style.cursor = 'pointer';
        } else {
          if (hoverCountry) { hoverCountry = null; updateTooltip(null); }
          canvas.style.cursor = 'grab';
        }
      }
    });

    canvas.addEventListener('mouseup', () => { canvas.style.cursor = 'grab'; });
    canvas.addEventListener('mouseleave', () => { updateTooltip(null); hoverCountry = null; });

    // Auto-rotate
    let autoRotate = true;
    canvas.addEventListener('mousedown', () => { autoRotate = false; });
    canvas.addEventListener('mouseup', () => { setTimeout(() => { autoRotate = true; }, 3000); });

    // Touch support
    let lastTouchX = 0;
    canvas.addEventListener('touchstart', e => { lastTouchX = e.touches[0].clientX; autoRotate = false; }, { passive: true });
    canvas.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - lastTouchX;
      globe.rotation.y += dx * 0.006;
      dots.rotation.y += dx * 0.006;
      lastTouchX = e.touches[0].clientX;
    }, { passive: true });
    canvas.addEventListener('touchend', () => setTimeout(() => { autoRotate = true; }, 3000));

    // Resize
    window.addEventListener('resize', () => {
      const W2 = canvas.parentElement.clientWidth;
      canvas.width = W2;
      renderer.setSize(W2, H);
      camera.aspect = W2 / H;
      camera.updateProjectionMatrix();
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      if (autoRotate) {
        globe.rotation.y += 0.0015;
        dots.rotation.y += 0.0015;
      }
      // Pulse ring
      if (ring.material.opacity > 0) {
        ring.scale.setScalar(1 + 0.05 * Math.sin(Date.now() * 0.005));
      }
      renderer.render(scene, camera);
    }
    animate();
  }

  // Init globe after DOM + THREE.js loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobe);
  } else {
    initGlobe();
  }
})();
