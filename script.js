document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modales y selects
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
    const selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);
  
    // Token de Mapbox (reemplaza con tu token)
    mapboxgl.accessToken = 'pk.eyJ1IjoibG9iZXRlNzciLCJhIjoiY204M213eW1tMDR6OTJrb2tlMGhhc2d5eCJ9.0K4Ci4sixdHbLiCjsU4OAA';
  
    // Inicializar el mapa
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-3.7038, 40.4168], // Coordenadas de Madrid
      zoom: 13
    });
  
    // Marcadores
    let markers = [];
    let currentMarker = null; // Almacena el marcador actual
  
    // Buscar dirección
    document.getElementById('search-address').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = this.value.trim();
        if (query === '') {
          alert('Por favor, ingresa una dirección.');
          return;
        }
  
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`)
          .then(response => response.json())
          .then(data => {
            if (data.features.length > 0) {
              const [lng, lat] = data.features[0].center;
              map.flyTo({ center: [lng, lat], zoom: 15 });
  
              // Mostrar un botón para agregar un marcador
              const addMarkerBtn = document.createElement('button');
              addMarkerBtn.textContent = 'Agregar Marcador Aquí';
              addMarkerBtn.className = 'btn green';
              addMarkerBtn.style.marginTop = '10px';
              addMarkerBtn.onclick = function() {
                const descripcion = prompt('Ingresa una descripción para el marcador:');
                if (descripcion) {
                  const color = document.getElementById('color-marcador').value;
                  const marker = new mapboxgl.Marker({ color })
                    .setLngLat([lng, lat])
                    .addTo(map);
  
                  // Mostrar la descripción en un modal
                  marker.getElement().addEventListener('click', () => {
                    const modalContent = `
                      <h4>Descripción del Marcador</h4>
                      <p>${descripcion}</p>
                      <button class="btn red" onclick="deleteMarker(${markers.length})">Eliminar Marcador</button>
                    `;
                    document.getElementById('markers-list-content').innerHTML = modalContent;
                    M.Modal.getInstance(document.getElementById('markers-list')).open();
                  });
  
                  markers.push({ marker, descripcion, color });
                }
              };
  
              const searchContainer = document.getElementById('search-address').parentElement;
              searchContainer.appendChild(addMarkerBtn);
            } else {
              alert('Dirección no encontrada.');
            }
          })
          .catch(error => {
            console.error('Error al buscar la dirección:', error);
            alert('Hubo un problema al buscar la dirección.');
          });
      }
    });
  
    // Añadir marcador al hacer clic en el mapa
    map.on('click', function(e) {
      if (currentMarker) {
        alert('Solo puedes colocar un marcador por reporte. Genera un nuevo reporte para agregar otro.');
        return;
      }
  
      const descripcion = document.getElementById('incidente-descripcion').value;
      if (descripcion.trim() === '') {
        alert('Por favor, ingresa una descripción antes de colocar un marcador.');
        return;
      }
  
      const color = document.getElementById('color-marcador').value;
      const marker = new mapboxgl.Marker({ color })
        .setLngLat(e.lngLat)
        .addTo(map);
  
      // Mostrar la descripción en un modal
      marker.getElement().addEventListener('click', () => {
        const modalContent = `
          <h4>Descripción del Marcador</h4>
          <p>${descripcion}</p>
          <button class="btn red" onclick="deleteMarker(${markers.length})">Eliminar Marcador</button>
        `;
        document.getElementById('markers-list-content').innerHTML = modalContent;
        M.Modal.getInstance(document.getElementById('markers-list')).open();
      });
  
      markers.push({ marker, descripcion, color });
      currentMarker = marker; // Guardar el marcador actual
    });
  
    // Eliminar marcador
    window.deleteMarker = function(index) {
      if (index >= 0 && index < markers.length) {
        markers[index].marker.remove(); // Eliminar el marcador del mapa
        markers.splice(index, 1); // Eliminar el marcador de la lista
        currentMarker = null; // Reiniciar el marcador actual
        M.Modal.getInstance(document.getElementById('markers-list')).close();
      }
    };
  
    // Mostrar lista de marcadores
    document.getElementById('show-markers-btn').addEventListener('click', function() {
      const listContent = markers.map((marker, index) => `
        <li>
          <strong>Marcador ${index + 1}:</strong> ${marker.descripcion}
          <button class="btn red" onclick="deleteMarker(${index})">Eliminar</button>
        </li>
      `).join('');
      document.getElementById('markers-list-content').innerHTML = listContent;
      M.Modal.getInstance(document.getElementById('markers-list')).open();
    });
  
    // Reportar incidente desde el modal
    document.getElementById('confirmar-reporte').addEventListener('click', function() {
      const descripcion = document.getElementById('incidente-descripcion').value;
      if (descripcion.trim() === '') {
        alert('Por favor, ingresa una descripción.');
        return;
      }
  
      alert('Ahora haz clic en el mapa para colocar el marcador.');
      M.Modal.getInstance(document.getElementById('reportar')).close();
    });
  
    // Botón de emergencia
    document.getElementById('llamar-emergencia').addEventListener('click', function() {
      alert('Llamando al 911...');
      // Aquí podrías integrar una API para llamadas de emergencia.
    });
  
    // Tutorial
    document.getElementById('tutorial-btn').addEventListener('click', function() {
      const instance = M.Modal.getInstance(document.getElementById('tutorial'));
      instance.open();
    });
  
    // Reportar incidente desde el botón
    document.getElementById('report-btn').addEventListener('click', function() {
      const instance = M.Modal.getInstance(document.getElementById('reportar'));
      instance.open();
    });
  
    // Emergencia desde el botón
    document.getElementById('emergency-btn').addEventListener('click', function() {
      const instance = M.Modal.getInstance(document.getElementById('emergencia'));
      instance.open();
    });
  });