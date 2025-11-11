# Multi-File Import Feature

## Overview
The Import Data modal now supports importing multiple files at once, with progress tracking and automatic file type detection.

## Changes Made

### 1. File Selection Enhancement
- **Added `multiple` attribute** to file input
- Users can now select multiple files using Ctrl/Cmd+Click or Shift+Click
- Drag-and-drop still works for single or multiple files

### 2. New FileImport Interface
```typescript
interface FileImport {
  file: File;
  content: string;
  format: SystemType;
  type: 'rules' | 'characters' | 'actions' | 'truth';
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}
```

### 3. Automatic Type Detection
Created `detectFileTypeAndFormat()` function that automatically determines:
- **Import type** based on filename:
  - Files with "cast" or "character" → Characters
  - Files with "action" → Actions
  - Files with "history" or "truth" → Truth
  - Everything else → Rules
- **Format** based on extension:
  - `.insimul` → Insimul Format
  - `.json`, `.ens` → Ensemble
  - `.lp`, `.kis` → Kismet
  - `.py` → TotT

### 4. File List Display
When files are selected, the modal shows:
- **File count**: "Selected Files (3):"
- **File details**: Name, type, and status for each file
- **Status indicators**:
  - 🔵 Pending (gray)
  - 🔵 Processing... (blue)
  - ✓ Success (green)
  - ✗ Error (red)
- **Clear Files button**: Remove all selected files

### 5. Sequential Processing
- Files are imported **one at a time** in order
- Real-time status updates for each file
- Progress visible in the file list
- Continues processing even if one file fails

### 6. Improved UX

#### File Upload Mode
- Shows file list with status tracking
- Hides paste content area when files are selected
- Import button shows: "Import 3 Files" when multiple files selected

#### Paste Content Mode
- Works as before for single content paste
- File list hidden when using paste mode

#### Batch Import Results
- Shows summary: "Successfully imported X file(s). Y failed."
- Keeps failed files visible for review
- Auto-closes only if all imports succeed

### 7. Refactored Import Logic
Created `importSingleContent()` helper function:
- Handles import for one piece of content
- Returns `{ success, count, message }`
- Used by both single paste and multi-file flows
- Supports all import types: rules, characters, actions, truth

## How to Use

### Single File Import (unchanged)
1. Click "Upload File(s)"
2. Select one file
3. Click "Import"

### Multiple File Import (new!)
1. Click "Upload File(s)"
2. Select multiple files (Ctrl/Cmd+Click)
3. Review the file list and auto-detected types
4. Check "Import as Base Resource" if needed (applies to all files)
5. Click "Import X Files"
6. Watch progress as each file is processed
7. Review results in the file list

### Batch Import from Folder
To import an entire folder of Ensemble files:
1. Navigate to the folder in file explorer
2. Select all files (Ctrl/Cmd+A)
3. Drag and drop onto the file input
4. Or use file picker and multi-select

## Example: Importing Ensemble Seed Data

If you have a folder structure like:
```
/ensemble/
  actions.json
  cast.json
  history.json
  social-rules.json
```

You can:
1. Select all 4 files at once
2. The system auto-detects:
   - `actions.json` → Actions (Ensemble)
   - `cast.json` → Characters (Ensemble)
   - `history.json` → Truth (Ensemble)
   - `social-rules.json` → Rules (Ensemble)
3. Import all in one batch
4. See individual success/error status for each file

## Base Resource Support
When importing multiple files as base resources:
- Check "Import as Base Resource" before importing
- Applies to ALL files in the batch
- Only affects Rules and Actions (Characters and Truth are world-specific)
- All base rules/actions will be globally available

## Error Handling
- Individual file failures don't stop the batch
- Failed files show error status and message
- Successful files are marked with ✓
- Can review and retry failed files by clearing and re-selecting
- Dialog stays open if any files failed for review

## Benefits
✅ **Faster imports**: Import entire Ensemble projects in one go
✅ **Auto-detection**: No manual format/type selection needed
✅ **Progress tracking**: See what's happening in real-time
✅ **Error resilience**: Partial success with clear feedback
✅ **Better UX**: Clear visual feedback for each file
✅ **Maintains backward compatibility**: Single file/paste still works

## Technical Details
- Files are read asynchronously using FileReader API
- Content stored in state with metadata
- Sequential processing prevents race conditions
- State updates trigger re-renders for live progress
- Toast notifications for batch completion
