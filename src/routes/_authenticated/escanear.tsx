import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exigirRol } from "@/lib/guard";
import { normalizarCodigo } from "@/lib/estados";

export const Route = createFileRoute("/_authenticated/escanear")({
  beforeLoad: ({ context }) => exigirRol(context.sesion, "tecnico"),
  head: () => ({
    meta: [
      { title: "Escanear QR · Andinas Search" },
      { name: "description", content: "Escanea el QR de una máquina para ver su ficha." },
    ],
  }),
  component: Escanear,
});

const ID_LECTOR = "lector-qr";

function Escanear() {
  const navigate = useNavigate();
  const [errorCamara, setErrorCamara] = useState("");
  const [codigo, setCodigo] = useState("");
  const [faltaCodigo, setFaltaCodigo] = useState(false);
  const leido = useRef(false);

  function abrir(texto: string) {
    const c = normalizarCodigo(texto);
    if (!c) return setFaltaCodigo(true);
    navigate({ to: "/maquina/$codigo", params: { codigo: c } });
  }

  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    let lector: { stop: () => Promise<void>; isScanning: boolean } | null = null;
    let cancelado = false;
    (async () => {
      if (!window.isSecureContext) {
        setErrorCamara(
          "La cámara solo funciona si la dirección de la página empieza con https://. Abre la app desde el enlace seguro y vuelve a intentar.",
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorCamara("Este navegador no permite usar la cámara. Escribe el código de la máquina abajo.");
        return;
      }
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelado) return;
      const l = new Html5Qrcode(ID_LECTOR);
      lector = l;
      try {
        await l.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (texto) => {
            if (leido.current) return;
            leido.current = true;
            abrir(texto);
          },
          () => {},
        );
        if (cancelado) await l.stop();
      } catch (e) {
        const nombre = e instanceof Error ? e.name : "";
        if (nombre === "NotAllowedError" || nombre === "SecurityError") {
          setErrorCamara(
            "La app no tiene permiso para usar la cámara. Toca el candado o el ícono de ajustes junto a la dirección de la página, permite la cámara y pulsa Reintentar.",
          );
        } else if (nombre === "NotFoundError" || nombre === "OverconstrainedError") {
          setErrorCamara("No se encontró una cámara en este equipo. Escribe el código de la máquina abajo.");
        } else {
          setErrorCamara("No se pudo abrir la cámara. Pulsa Reintentar o escribe el código de la máquina abajo.");
        }
      }
    })();
    return () => {
      cancelado = true;
      if (lector?.isScanning) lector.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentos]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    abrir(codigo);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="size-14 shrink-0">
          <Link to="/tecnico" aria-label="Volver al inicio">
            <ArrowLeft className="size-7" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Escanear QR</h1>
      </div>

      <p className="text-xl text-foreground">Apunta la cámara al código QR de la máquina.</p>
      <div id={ID_LECTOR} className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border-2 bg-muted" />
      {errorCamara && (
        <div className="space-y-3 rounded-2xl border-2 border-destructive bg-card p-5">
          <p className="text-lg font-bold text-destructive">{errorCamara}</p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-14 w-full text-xl"
            onClick={() => {
              setErrorCamara("");
              leido.current = false;
              setIntentos((n) => n + 1);
            }}
          >
            Reintentar cámara
          </Button>
        </div>
      )}

      <form onSubmit={enviar} className="space-y-3 rounded-2xl border-2 bg-card p-5">
        <label htmlFor="codigo" className="block text-xl font-bold">
          ¿La cámara no funciona? Escribe el código
        </label>
        <Input
          id="codigo"
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value);
            setFaltaCodigo(false);
          }}
          placeholder="Ej.: TOR-001"
          autoCapitalize="characters"
          className={`h-14 text-xl ${faltaCodigo ? "border-2 border-destructive" : ""}`}
        />
        {faltaCodigo && <p className="text-lg font-bold text-destructive">Escribe el código de la máquina.</p>}
        <Button type="submit" size="lg" className="h-16 w-full text-xl">
          <Search /> Buscar máquina
        </Button>
      </form>
    </div>
  );
}
