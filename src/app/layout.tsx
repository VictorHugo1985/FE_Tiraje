// src/app/layout.tsx
import type { Metadata } from "next";
import ThemeRegistry from "../theme/ThemeRegistry";

// Importa los pesos de la fuente Roboto
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export const metadata: Metadata = {
  title: "Registro de Producción",
  description: "MVP para el registro de producción en prensa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
