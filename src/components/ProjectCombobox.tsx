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
            onFocus={() => setOpen(true)}
            placeholder="프로젝트 검색..."
            className="w-full bg-white pr-8"
          />
          <ChevronsUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-white" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredProjects.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 hover:text-gray-900",
                  value === project.id.toString() ? "bg-gray-100 text-gray-900" : ""
                )}
                onClick={() => handleSelect(project)}
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
            className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 hover:text-gray-900",
                value === "other" ? "bg-gray-100 text-gray-900" : ""
            )}
            onClick={handleSelectOther}
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
