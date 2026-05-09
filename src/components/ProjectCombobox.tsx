"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface Project {
  id: number
  project_name: string
  project_number: string
  description?: string
}

interface ProjectComboboxProps {
  projects: Project[]
  value: string
  onChange: (value: string) => void
  onSelectProject: (project: Project) => void
}

export function ProjectCombobox({ projects, value, onChange, onSelectProject }: ProjectComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Find selected project to set initial input value
  const selectedProject = React.useMemo(() =>
    projects.find((project) => project.id.toString() === value),
    [projects, value]
  )

  // Update input value when selection changes externally
  React.useEffect(() => {
    if (value === "other") {
      setInputValue("기타")
    } else if (selectedProject) {
      setInputValue(`[${selectedProject.project_number}] ${selectedProject.project_name}`)
    } else if (!value) {
      setInputValue("")
    }
  }, [value, selectedProject])

  const filteredProjects = React.useMemo(() => {
    if (!inputValue) return projects
    // If input matches the selected project display string exactly, show all (or don't filter by it)
    // But usually we want to filter by what the user types.
    // If the user just selected something, inputValue is the full string.
    // If they start deleting, we filter.

    // Simple logic: filter by input value
    const lowerQuery = inputValue.toLowerCase()
    return projects.filter((project) => {
      const displayString = `[${project.project_number}] ${project.project_name}`
      return (
        project.project_name.toLowerCase().includes(lowerQuery) ||
        project.project_number.toLowerCase().includes(lowerQuery) ||
        displayString.toLowerCase().includes(lowerQuery)
      )
    })
  }, [projects, inputValue])

  // Reset selected index when search changes or popover opens
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [inputValue, open])

  // Scroll the selected item into view
  React.useEffect(() => {
    if (open && listRef.current) {
      // +1 to account for the "No results" or other leading elements if any, 
      // but in our structure, the list items are direct children.
      // Wait, there might be a "No results" div which is children[0].
      // But we map over filteredProjects. So children[selectedIndex] is fine if filteredProjects.length > 0.
      const items = listRef.current.querySelectorAll('[role="option"]')
      const selectedItem = items[selectedIndex] as HTMLElement
      if (selectedItem) {
        const container = listRef.current
        const itemTop = selectedItem.offsetTop
        const itemBottom = itemTop + selectedItem.offsetHeight
        const containerTop = container.scrollTop
        const containerBottom = containerTop + container.offsetHeight

        if (itemTop < containerTop) {
          container.scrollTop = itemTop
        } else if (itemBottom > containerBottom) {
          container.scrollTop = itemBottom - container.offsetHeight
        }
      }
    }
  }, [selectedIndex, open])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true)
        e.preventDefault()
      }
      return
    }

    const maxIndex = filteredProjects.length // 0 to length-1 are projects, length is "기타"

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredProjects.length === 0) {
        if (selectedIndex === 0) handleSelectOther()
      } else {
        if (selectedIndex < filteredProjects.length) {
          handleSelect(filteredProjects[selectedIndex])
        } else {
          handleSelectOther()
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setOpen(true)
    // If user clears input, maybe clear selection?
    if (e.target.value === "") {
      onChange("")
    }
  }

  const handleSelect = (project: Project) => {
    setInputValue(`[${project.project_number}] ${project.project_name}`)
    onChange(project.id.toString())
    onSelectProject(project)
    setOpen(false)
  }

  const handleSelectOther = () => {
    setInputValue("기타")
    onChange("other")
    onSelectProject({ id: 0, project_name: "기타", project_number: "0000" } as Project)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            placeholder="프로젝트 검색..."
            className="w-full bg-white pr-8"
          />
          <ChevronsUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-white" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div ref={listRef} className="max-h-[300px] overflow-y-auto p-1 relative">
          {filteredProjects.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            filteredProjects.map((project, index) => (
              <div
                key={project.id}
                role="option"
                aria-selected={selectedIndex === index}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 hover:text-gray-900",
                  selectedIndex === index ? "bg-gray-100 text-gray-900" : "",
                  value === project.id.toString() ? "bg-blue-50 text-blue-900 font-medium" : ""
                )}
                onClick={() => handleSelect(project)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === project.id.toString() ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">[{project.project_number}] {project.project_name}</span>
                  {project.description && <span className="text-xs text-gray-500 truncate max-w-[300px]">{project.description}</span>}
                </div>
              </div>
            ))
          )}
          <div
            role="option"
            aria-selected={selectedIndex === filteredProjects.length}
            className={cn(
              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 hover:text-gray-900",
              selectedIndex === filteredProjects.length ? "bg-gray-100 text-gray-900" : "",
              value === "other" ? "bg-blue-50 text-blue-900 font-medium" : ""
            )}
            onClick={handleSelectOther}
            onMouseEnter={() => setSelectedIndex(filteredProjects.length)}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === "other" ? "opacity-100" : "opacity-0"
              )}
            />
            기타
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
