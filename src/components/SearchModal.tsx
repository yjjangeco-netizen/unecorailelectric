'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search } from 'lucide-react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => void
}

export default function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    onSearch(searchQuery)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>재고 검색</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              검색어
            </label>
            <input
              type="text"
              id="searchQuery"
              name="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="품목명, 규격, 카테고리로 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button onClick={handleSearch} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 