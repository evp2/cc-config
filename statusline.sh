#!/bin/bash
# Claude Code status line.
# LEFT  : current working directory  |  git branch (dirty marker)
# RIGHT : context-remaining percentage  |  model name
# Right side is right-aligned to the terminal width.
# Colors are ANSI 256-color codes at full intensity.

input=$(cat)

model=$(printf '%s' "$input" | jq -r '.model.display_name // "Claude"')
cwd=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // empty')

RESET=$'\033[0m'
DIR_COLOR=$'\033[38;5;39m'      # blue
GIT_CLEAN_COLOR=$'\033[38;5;214m'  # orange
GIT_DIRTY_COLOR=$'\033[38;5;203m'  # red-orange
CTX_COLOR=$'\033[38;5;120m'     # green
MODEL_COLOR=$'\033[38;5;135m'   # purple
SEP_COLOR=$'\033[38;5;240m'     # gray (subdued, separator)
SEP="${SEP_COLOR} ❯ ${RESET}"

# ---- left: cwd + git branch ----
# Show the last two path components (parent/base) so generic leaf names like
# "function" or "src" aren't ambiguous; collapse $HOME to ~ and handle the
# top-level cases (/, $HOME, and a dir directly under /).
if [ -z "$cwd" ]; then
  dir_name="~"
elif [ "$cwd" = "/" ]; then
  dir_name="/"
elif [ "$cwd" = "$HOME" ]; then
  dir_name="~"
else
  base=$(basename "$cwd")
  parent_path=$(dirname "$cwd")
  if [ "$parent_path" = "/" ]; then
    dir_name="/$base"
  elif [ "$parent_path" = "$HOME" ]; then
    dir_name="~/$base"
  else
    dir_name="$(basename "$parent_path")/$base"
  fi
fi

branch=""
dirty=""
if [ -n "$cwd" ] && git -C "$cwd" --no-optional-locks rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short -q HEAD 2>/dev/null)
  if [ -z "$branch" ]; then
    branch=$(git -C "$cwd" --no-optional-locks rev-parse --short HEAD 2>/dev/null)
  fi
  if ! git -C "$cwd" --no-optional-locks diff --quiet 2>/dev/null \
     || ! git -C "$cwd" --no-optional-locks diff --cached --quiet 2>/dev/null \
     || [ -n "$(git -C "$cwd" --no-optional-locks ls-files --others --exclude-standard 2>/dev/null)" ]; then
    dirty="*"
  fi
fi

left_plain="$dir_name"
left_colored="${DIR_COLOR}${dir_name}${RESET}"
if [ -n "$branch" ]; then
  color="$GIT_CLEAN_COLOR"
  [ -n "$dirty" ] && color="$GIT_DIRTY_COLOR"
  left_plain="${left_plain} ❯ ${branch}${dirty}"
  left_colored="${left_colored}${SEP}${color}${branch}${dirty}${RESET}"
fi

# ---- right: context remaining % + model name ----
# Claude Code nulls out context_window.current_usage before the first API call
# of a session -- including right after /clear and /compact -- but leaves
# remaining_percentage carrying the PREVIOUS session's value until the next
# call repopulates it. Reading remaining_percentage directly therefore shows a
# stale figure after /clear. Only trust it once current_usage is populated;
# until then the conversation is empty, so report 100%.
remaining=""
if [ "$(printf '%s' "$input" | jq -r 'has("context_window") and .context_window != null')" = "true" ]; then
  if [ "$(printf '%s' "$input" | jq -r '.context_window.current_usage != null')" = "true" ]; then
    remaining=$(printf '%s' "$input" | jq -r '.context_window.remaining_percentage // empty')
  else
    remaining="100"
  fi
fi

# Repeat a (possibly multibyte) char N times; safe for N=0 (printf would
# otherwise emit the format string once with no args).
repeat() {
  local out="" i=0
  while [ "$i" -lt "$2" ]; do out="$out$1"; i=$((i + 1)); done
  printf '%s' "$out"
}

right_plain=""
right_colored=""
if [ -n "$remaining" ]; then
  ctx=$(printf '%.0f' "$remaining")

  # Bar fills with the context still available; color shifts as it runs low.
  bar_width=10
  filled=$(((ctx * bar_width + 50) / 100))
  [ "$filled" -gt "$bar_width" ] && filled=$bar_width
  [ "$filled" -lt 0 ] && filled=0
  empty=$((bar_width - filled))

  if [ "$ctx" -ge 50 ]; then
    bar_color="$CTX_COLOR"        # green  — plenty left
  elif [ "$ctx" -ge 20 ]; then
    bar_color="$GIT_CLEAN_COLOR"  # orange — getting tight
  else
    bar_color="$GIT_DIRTY_COLOR"  # red    — nearly full
  fi

  bar_filled=$(repeat '█' "$filled")
  bar_empty=$(repeat '░' "$empty")

  right_plain="ctx ${bar_filled}${bar_empty} ${ctx}%"
  right_colored="${SEP_COLOR}ctx ${RESET}${bar_color}${bar_filled}${SEP_COLOR}${bar_empty}${RESET} ${bar_color}${ctx}%${RESET}"
fi

if [ -n "$right_plain" ]; then
  right_plain="${right_plain} ❯ ${model}"
  right_colored="${right_colored}${SEP}${MODEL_COLOR}${model}${RESET}"
else
  right_plain="${model}"
  right_colored="${MODEL_COLOR}${model}${RESET}"
fi

# ---- assemble, right-aligning the right segment to terminal width ----
term_width=$(tput cols 2>/dev/null)
[ -z "$term_width" ] && term_width=80

left_len=${#left_plain}
right_len=${#right_plain}
padding=$((term_width - left_len - right_len))
[ "$padding" -lt 1 ] && padding=1

printf '%s%*s%s' "$left_colored" "$padding" "" "$right_colored"
