"use client";

/**
 * Navegación del panel admin.
 *
 * Lista de secciones del panel. Las que todavía no existen (módulos
 * posteriores) se muestran deshabilitadas con la etiqueta "pronto" —
 * al construir cada módulo se pone `enabled: true`.
 *
 * Se reusa en el sidebar de escritorio y en el drawer móvil.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderTreeIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  TicketIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/core/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** `false` mientras el módulo no esté construido. */
  enabled: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, enabled: true },
  { label: "Productos", href: "/admin/productos", icon: PackageIcon, enabled: true },
  { label: "Categorías", href: "/admin/categorias", icon: FolderTreeIcon, enabled: true },
  // Sección "Contenido" deshabilitada temporalmente — oculta del nav y con
  // el acceso a `/admin/contenido` bloqueado (ver `contenido/layout.tsx`).
  // { label: "Contenido", href: "/admin/contenido", icon: LayoutTemplateIcon, enabled: true },
  { label: "Órdenes", href: "/admin/ordenes", icon: ShoppingBagIcon, enabled: true },
  { label: "Clientes", href: "/admin/clientes", icon: UsersIcon, enabled: true },
  { label: "Cupones", href: "/admin/cupones", icon: TicketIcon, enabled: true },
  { label: "Usuarios", href: "/admin/usuarios", icon: UserCogIcon, enabled: true },
  { label: "Configuración", href: "/admin/configuracion", icon: SettingsIcon, enabled: true },
];

interface AdminNavProps {
  /** Se llama al navegar — sirve para cerrar el drawer en móvil. */
  onNavigate?: () => void;
}

export function AdminNav({ onNavigate }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        if (!item.enabled) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50"
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
              <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                pronto
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
