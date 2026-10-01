const fs = require('fs');
const files = [
    'frontend/src/modules/catalogo/components/CatalogoVista.tsx',
    'frontend/src/modules/catalogo/components/EventoCard.tsx',
    'frontend/src/modules/catalogo/components/DetalleEventoPlaceholder.tsx'
];

const replacements = {
    'evento_id': 'id_evento',
    'evento_titulo': 'nombre_evento',
    'evento_descripcion': 'descripcion_evento',
    'evento_lugar': 'lugar_evento',
    'evento_fecha': 'fecha_evento',
    'evento_hora': 'hora_evento',
    'evento_imagen': 'imagen_evento',
    'evento_precio_final': 'precio_final_evento',
    'evento_tipo': 'tipo_evento',
    'evento_categoria': 'categoria_evento',
    'evento_estado': 'estado_evento',
    'inventario_stock': 'stock_actual',
    'resena_calificacion_promedio': 'promedio_calificacion',
    'resena_total': 'total_resenas'
};

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    for (const [oldName, newName] of Object.entries(replacements)) {
        content = content.replace(new RegExp(oldName, 'g'), newName);
    }
    fs.writeFileSync(file, content);
});
console.log("Reemplazo completado en los componentes.");
