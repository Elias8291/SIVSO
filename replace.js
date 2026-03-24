const fs = require('fs');
const file = 'c:/Users/Elias/Documents/react-laravel-sivso/resources/js/pages/MiVestuarioPage.jsx';
let content = fs.readFileSync(file, 'utf8');
const startToken = '/* ── Categorías visuales por partida ──────────────────────────────────────── */';
const endToken = '/* ── Página principal ─────────────────────────────────────────────────────── */';
const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken);
if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `import {
    mergedRow,
    rowsEquivalent,
    displayItem,
    listarPrendasConTallaPendiente,
    Toast,
    ModalCantidad,
    PrendaCard,
    ModalTalla,
    ModalCambiarProducto,
} from '../features/vestuario/VestuarioEditorShared';\n\n`;
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    content = content.replace("import { Shirt, Ruler, RefreshCw, CheckCircle, Search, AlertCircle } from 'lucide-react';", "import { Shirt, Search, AlertCircle } from 'lucide-react';");
    fs.writeFileSync(file, content, 'utf8');
    console.log('Update successful!');
} else {
    console.log('Tokens not found!');
}
