import os

file_path = 'src/app/schedule/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Corrections map (0-based index)
# Based on view_file output which is 1-based.
# 680 -> 679
# 944 -> 943
# 955 -> 954

corrections = {
    679: "                          {format(eventStart, 'M월', { locale: ko })}\n",
    943: "                      {format(parseISO(todo.dueDate), 'M월 d일', { locale: ko })}\n",
    954: "                    {todo.priority === 'high' ? '긴급' : todo.priority === 'medium' ? '보통' : '낮음'}\n"
}

for idx, content in corrections.items():
    if idx < len(lines):
        # Verify we are replacing the right lines (safety check)
        # simplistic check: print what we are replacing
        print(f"Replacing line {idx+1}: {lines[idx].strip()} -> {content.strip()}")
        lines[idx] = content

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Successfully patched additional corruptions in src/app/schedule/page.tsx")
