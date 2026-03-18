/**
 * Spinner de carga del Explorador.
 */
export default function ExplorerSpinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <span className="size-5 border-2 border-zinc-200 border-t-[#AF9460] rounded-full animate-spin" />
        </div>
    );
}
