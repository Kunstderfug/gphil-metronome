# Output Folder Feature Implementation

## Date Created
2025-06-17
## Last Updated
2025-06-17

## Description
This document describes the implementation of the user-selectable output folder feature with an improved workflow for the G-Phil Metronome application.

## Feature Overview
The application now implements a two-step workflow:
1. First, users select input files (opus files)
2. Then, users select where to save the parsed JSON files directly, without creating additional subfolder structures

This provides maximum flexibility, clear user control, and simplifies file management by ensuring files are only written when the user explicitly chooses the output location.

## Implementation Details

### Frontend Changes
- **Two-Step Workflow**: Implemented clear separation between input file selection and output folder selection
- **Progressive Disclosure**: Output folder picker and action buttons are disabled until input files are loaded
- **Real-time Feedback**: Shows count of loaded files and selected output folder
- **Automatic Processing**: Files are processed automatically when output folder is selected
- **Simplified Filenames**: Removed complex folder structure from filenames, now using simple `[filename]_CLICKDATA.json` format
- **Input Validation**: Added checks to ensure input files are loaded before allowing output selection

### Backend Changes
- **Direct File Saving**: Files are saved directly in the selected output folder without creating subfolders
- **Enhanced Logging**: Added detailed console logging to track file operations and debugging
- **Error Handling**: Improved error reporting with clear messages for folder creation and file writing
- **Path Handling**: Updated to use the user-selected output path instead of organized folder structures
- **Fallback Support**: Maintains backward compatibility by defaulting to the `json/` folder when no output folder is selected

## Key Files Modified

### Frontend
- `server/views/index.ejs`: Added output folder selection UI section
- `server/public/opus_parser.js`: Enhanced to handle output folder selection and simplified file structure
- `server/public/main.js`: Added event handling for output folder selection
- `server/public/style.css`: Added styling for output folder section and selection feedback

### Backend
- `server/server.mjs`: Modified writeFile function to save directly to selected output folder

## Usage

### Web Interface Workflow
1. **Select Input Files**: Choose opus files (from folder or individually)
   - UI shows count of loaded opus files
   - Output folder picker remains disabled until this step is complete

2. **Select Output Folder**: Choose exactly where you want the parsed JSON files saved
   - Output folder picker becomes enabled after files are loaded
   - Selected folder is displayed for confirmation
   - Files are automatically processed and uploaded to server

3. **Processing**: 
   - Files are processed and saved directly to the selected folder
   - Progress bar shows upload status
   - Success/error messages for each file

### File Structure
```
SelectedOutputFolder/
├── filename1_CLICKDATA.json
├── filename2_CLICKDATA.json
├── filename3_CLICKDATA.json
└── ...
```

**Key Improvement**: No files are written until the user explicitly selects an output folder.

## Technical Notes

### Folder Selection
- Uses `webkitdirectory` attribute for native folder picker
- **Progressive Enablement**: Output folder picker is disabled until input files are loaded
- Extracts folder name from `webkitRelativePath` property
- **Automatic Processing**: Files are processed immediately upon output folder selection
- Shows clear visual feedback of selected folder and file count
- Prevents accidental file writing by requiring explicit output folder selection

### Filename Simplification
- Removed composer/concerto/movement folder structure
- Simple format: `[original_filename]_CLICKDATA.json`
- Maintains all musical timing data in the JSON content

### Error Handling
- **Input Validation**: Ensures opus files are loaded before allowing output folder selection
- **Output Validation**: Validates that output folder is selected before processing
- **Progressive UI**: Disables controls until prerequisites are met
- **Clear Messaging**: Provides helpful error messages at each step
- **Server Logging**: Enhanced server-side logging for debugging file operations
- Graceful fallback to default `json/` folder when needed

### Browser Limitations
- Local downloads (without server) still use browser's default download location
- Server uploads can write to any accessible directory on the server
- Folder selection requires modern browsers with `webkitdirectory` support

## Benefits

### User Experience
- **Two-Step Clarity**: Clear separation between input and output selection
- **Direct Control**: Users choose exactly where files are saved
- **No Accidental Writing**: Files are only written when user explicitly selects output folder
- **Simple Structure**: No complex folder hierarchies to navigate
- **Clear Feedback**: Real-time display of loaded files and selected output folder
- **Flexible Workflow**: Can save to any accessible location
- **Progressive Interface**: Controls are enabled/disabled based on workflow state

### File Management
- **Flat Structure**: All files in one location for easy access
- **Predictable Naming**: Consistent `[filename]_CLICKDATA.json` format
- **No Duplication**: Avoids creating unnecessary subfolders
- **Intentional Writing**: Files are only created when user explicitly chooses destination
- **Memory Efficient**: Files are loaded into memory and processed only when output folder is selected

## Future Enhancements
- Implement File System Access API for direct local folder writing (Chrome-only)
- Add option to preserve original folder structure for users who prefer it
- Support for multiple output folder selection in a single session
- Batch file processing for multiple input/output combinations
- Add file preview before processing
- Implement drag-and-drop for both input and output folder selection
- Add ability to pause/resume processing

## Backward Compatibility
-