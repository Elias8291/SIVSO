import sys
import re

file_path = r'c:\Users\Elias\Documents\react-laravel-sivso\resources\js\pages\MiVestuarioPage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_token = r'/* ── Categorías visuales por partida ──────────────────────────────────────── */'
end_token = r'/* ── Página principal ─────────────────────────────────────────────────────── */'

start_idx = content.find(start_token)
end_idx = content.find(end_token)

if start_idx != -1 and end_idx != -1:
    replacement = """import {
    mergedRow,
    rowsEquivalent,
    displayItem,
    listarPrendasConTallaPendiente,
    Toast,
    ModalCantidad,
    PrendaCard,
    ModalTalla,
    ModalCambiarProducto,
} from '../features/vestuario/VestuarioEditorShared';\n\n"""
    new_content = content[:start_idx] + replacement + content[end_idx:]
    
    new_content = new_content.replace("import { Shirt, Ruler, RefreshCw, CheckCircle, Search, AlertCircle } from 'lucide-react';", "import { Shirt, Search, AlertCircle } from 'lucide-react';")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Update successful!")
else:
    print("Tokens not found!")
