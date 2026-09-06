// Enum re-exports plus the numeric constants `discord-interactions` doesn't
// ship, so handlers never hardcode magic numbers.
export {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
} from "discord-interactions";

export const ComponentType = {
  ACTION_ROW: 1,
  BUTTON: 2,
  STRING_SELECT: 3,
  USER_SELECT: 5,
} as const;

export const ButtonStyle = {
  PRIMARY: 1,
  SECONDARY: 2,
  SUCCESS: 3,
  DANGER: 4,
} as const;

// Application command option types (subset used here).
export const CommandOptionType = {
  SUB_COMMAND: 1,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
} as const;
