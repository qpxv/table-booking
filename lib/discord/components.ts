import { ComponentType, ButtonStyle } from "./interactions";

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

function actionRow(component: Record<string, unknown>): Record<string, unknown> {
  return { type: ComponentType.ACTION_ROW, components: [component] };
}

export function stringSelectRow(
  customId: string,
  placeholder: string,
  options: SelectOption[],
  opts: { minValues?: number; maxValues?: number } = {},
): Record<string, unknown> {
  return actionRow({
    type: ComponentType.STRING_SELECT,
    custom_id: customId,
    placeholder,
    min_values: opts.minValues ?? 1,
    max_values: opts.maxValues ?? 1,
    // Discord caps a select at 25 options.
    options: options.slice(0, 25).map((o) => ({
      label: o.label.slice(0, 100),
      value: o.value,
      ...(o.description ? { description: o.description.slice(0, 100) } : {}),
    })),
  });
}

export function userSelectRow(
  customId: string,
  placeholder: string,
  opts: { minValues?: number; maxValues?: number } = {},
): Record<string, unknown> {
  return actionRow({
    type: ComponentType.USER_SELECT,
    custom_id: customId,
    placeholder,
    min_values: opts.minValues ?? 0,
    max_values: opts.maxValues ?? 10,
  });
}

export function buttonRow(
  customId: string,
  label: string,
  style: number = ButtonStyle.PRIMARY,
): Record<string, unknown> {
  return actionRow({
    type: ComponentType.BUTTON,
    custom_id: customId,
    label,
    style,
  });
}
