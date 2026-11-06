import type { ComponentProps } from "react";
import type { StoryObj } from "@storybook/react-vite";
import { LuInfo, LuSearch } from "react-icons/lu";
import { Avatar, Badge, BreadcrumbItem, Button, Checkbox, Divider, Icon, IconButton, RadioButton, Skeleton, Spinner, Switch, TabItem, TextInput, TextLink, Tooltip } from "@/components/atoms/catalog";

export default { title: "Atoms/Catalog", tags: ["autodocs"] };

export const ButtonAtom: StoryObj<ComponentProps<typeof Button>> = {
  name: "Button", args: { children: "Guardar", variant: "primary", size: "md" },
  argTypes: { variant: { control: "select", options: ["primary", "secondary", "ghost", "destructive"] }, size: { control: "select", options: ["sm", "md", "lg"] } },
  render: args => <Button {...args} />,
};
export const IconButtonAtom: StoryObj<ComponentProps<typeof IconButton>> = {
  name: "IconButton", args: { icon: LuSearch, label: "Buscar", variant: "ghost", size: "md" },
  argTypes: { icon: { control: false }, variant: { control: "select", options: ["primary", "secondary", "ghost", "destructive"] }, size: { control: "select", options: ["sm", "md", "lg"] } },
  render: args => <IconButton {...args} />,
};
export const TextInputAtom: StoryObj<ComponentProps<typeof TextInput>> = {
  name: "TextInput", args: { placeholder: "Nombre del proyecto", "aria-label": "Nombre del proyecto", size: "md", error: false },
  argTypes: { size: { control: "select", options: ["sm", "md", "lg"] } }, render: args => <TextInput {...args} />,
};
export const CheckboxAtom: StoryObj<ComponentProps<typeof Checkbox>> = {
  name: "Checkbox", args: { "aria-label": "Seleccionar", defaultChecked: true, indeterminate: false }, render: args => <Checkbox {...args} />,
};
export const RadioButtonAtom: StoryObj<ComponentProps<typeof RadioButton>> = {
  name: "RadioButton", args: { name: "catalog-radio", "aria-label": "Opción", defaultChecked: true }, render: args => <RadioButton {...args} />,
};
export const SwitchAtom: StoryObj<ComponentProps<typeof Switch>> = {
  name: "Switch", args: { "aria-label": "Notificaciones", defaultChecked: true }, render: args => <Switch {...args} />,
};
export const BadgeAtom: StoryObj<ComponentProps<typeof Badge>> = {
  name: "Badge", args: { children: "En revisión", tone: "review" },
  argTypes: { tone: { control: "select", options: ["neutral", "info", "danger", "positive", "review"] } }, render: args => <Badge {...args} />,
};
export const AvatarAtom: StoryObj<ComponentProps<typeof Avatar>> = {
  name: "Avatar", args: { initials: "MG", name: "María Gómez", size: "md" },
  argTypes: { size: { control: "select", options: ["sm", "md", "lg"] } }, render: args => <Avatar {...args} />,
};
export const TextLinkAtom: StoryObj<ComponentProps<typeof TextLink>> = {
  name: "TextLink", args: { href: "#enlace", children: "Ver detalles", external: false }, render: args => <TextLink {...args} />,
};
export const BreadcrumbItemAtom: StoryObj<ComponentProps<typeof BreadcrumbItem>> = {
  name: "BreadcrumbItem", args: { href: "#portafolio", children: "Portafolio", current: false }, render: args => <BreadcrumbItem {...args} />,
};
export const TabItemAtom: StoryObj<ComponentProps<typeof TabItem>> = {
  name: "TabItem", args: { children: "Resumen", selected: true }, render: args => <TabItem {...args} />,
};
export const SpinnerAtom: StoryObj<ComponentProps<typeof Spinner>> = {
  name: "Spinner", args: { size: "md", label: "Cargando" },
  argTypes: { size: { control: "select", options: ["sm", "md", "lg"] } }, render: args => <Spinner {...args} />,
};
export const SkeletonAtom: StoryObj<ComponentProps<typeof Skeleton>> = {
  name: "Skeleton", args: { width: 180, height: 20 }, render: args => <Skeleton {...args} />,
};
export const TooltipAtom: StoryObj<ComponentProps<typeof Tooltip>> = {
  name: "Tooltip", args: { text: "Información" }, render: args => <Tooltip {...args}><IconButton icon={LuInfo} label="Información" /></Tooltip>,
};
export const IconAtom: StoryObj<ComponentProps<typeof Icon>> = {
  name: "Icon", args: { glyph: LuInfo, size: "md" }, argTypes: { glyph: { control: false }, size: { control: "select", options: ["sm", "md", "lg"] } }, render: args => <Icon {...args} />,
};
export const DividerAtom: StoryObj<ComponentProps<typeof Divider>> = {
  name: "Divider", args: { orientation: "horizontal" },
  argTypes: { orientation: { control: "select", options: ["horizontal", "vertical"] } }, render: args => <div style={{ width: "min(220px, 100%)", minHeight: 32, display: "flex" }}><Divider {...args} /></div>,
};
