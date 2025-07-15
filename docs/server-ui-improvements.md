# Server UI Styling Improvements

## Overview
This document outlines the visual styling improvements made to the server folder's user interface, specifically addressing the lack of proper padding and overall visual hierarchy.

## Changes Made

### 1. Enhanced Padding and Spacing
- **Body**: Added `padding: 1rem` to provide consistent outer spacing
- **App Container**: Increased padding from `2rem` to `3rem 2rem` for better content breathing room
- **Sections**: Added `padding: 2rem` with `margin: 2rem 0` for proper content separation
- **Buttons**: Enhanced padding from `0.6em 1.2em` to `0.8rem 1.5rem` with additional margins
- **File Input**: Added `padding: 0.5rem` with proper margins for better accessibility

### 2. Improved Visual Hierarchy
- **Header Section**: Added dedicated header with title and description
- **Semantic HTML**: Converted divs to semantic elements (`<main>`, `<header>`, `<section>`)
- **Typography**: Improved font sizes and color contrast for better readability

### 3. Enhanced Components

#### File Upload Section
- Wrapped in a dedicated section with proper padding
- Added descriptive heading and label
- Improved visual feedback with background color and borders

#### Button Styling
- Increased touch target size with better padding
- Added consistent margins between buttons
- Enhanced hover and focus states

#### Layout Structure
- Better organized content with semantic HTML5 elements
- Improved spacing between functional areas
- Added visual separation with subtle borders and backgrounds

### 4. Responsive Design
- Added mobile-friendly breakpoints at 768px
- Adjusted padding and margins for smaller screens
- Optimized button sizes for touch interfaces
- Maintained readability across different screen sizes

### 5. Color Scheme and Theming
- Enhanced dark mode styling with proper contrast ratios
- Added light mode support with appropriate color adjustments
- Used semi-transparent backgrounds for layered visual depth
- Maintained accessibility standards for color contrast

## Technical Details

### CSS Structure
- Organized styles with consistent indentation and grouping
- Used relative units (rem, em) for better scalability
- Implemented CSS custom properties for theming
- Added proper box-sizing for predictable layouts

### Browser Compatibility
- Used modern CSS features with appropriate fallbacks
- Maintained cross-browser compatibility for focus states
- Implemented responsive design using standard media queries

## Files Modified
1. `metronome/server/public/style.css` - Complete styling overhaul
2. `metronome/server/views/index.ejs` - HTML structure improvements

## Impact
- **User Experience**: Significantly improved visual clarity and ease of use
- **Accessibility**: Better focus indicators and semantic structure
- **Maintainability**: Organized CSS with clear naming conventions
- **Responsiveness**: Optimized for various screen sizes and devices

## Future Considerations
- Consider adding CSS Grid or Flexbox layouts for more complex designs
- Implement CSS variables for easier theme customization
- Add loading states and progress indicators for file processing
- Consider implementing a design system for consistency across the application

## New Features

### Folder Selection Support
Added the ability to select entire folders containing opus files instead of selecting files individually:

#### Features
- **Toggle Selection Mode**: Radio button interface to choose between folder and individual file selection
- **Automatic File Filtering**: Automatically filters for .opus files when selecting folders
- **Recursive Folder Support**: Processes all opus files in selected folder and subfolders
- **User Feedback**: Clear labeling and helpful notes for each selection mode

#### Implementation Details
- Uses `webkitdirectory` attribute for folder selection
- JavaScript filtering to process only .opus files from folder contents
- Dynamic UI updates based on selection mode
- Maintains backward compatibility with individual file selection

#### Benefits
- **Improved Workflow**: Process entire directories of opus files at once
- **User Convenience**: No need to select files individually
- **Flexible Options**: Choose the best method for your use case

## Bug Fixes

### Folder Name Generation
Fixed the `getFolderName` function in `opus_parser.js` to properly extract the PATH for folder organization:

**Examples:**
- `COUPERIN_TICTOC_1_EXPO_1_100.opus` → folder: `COUPERIN_TICTOC`
- `COUPERIN_TICTOC_1_EP_100.opus` → folder: `COUPERIN_TICTOC`

#### Previous Issue
The original function was extracting section names instead of the PATH, creating multiple folders when only one root folder per PATH was needed.

#### Solution
Implemented a reverse-parsing algorithm that:
1. Splits filename by underscores
2. Removes tempo (last part - always a number)
3. Removes optional section index (if last part is a number)
4. Removes section name (text part)
5. Removes movement/track number
6. Joins remaining parts to form the PATH folder name

#### Result Structure
- **Root folder**: PATH (e.g., `COUPERIN_TICTOC`)
- **Files inside**: Original filenames as JSON (e.g., `COUPERIN_TICTOC_1_EXPO_1_100.json`)

#### Additional Fixes
- Fixed `writeJsonFiles` function to properly reference parsed files
- Added comprehensive test cases for validation
- Added debugging output for folder name generation

### Visual Feedback System
Added comprehensive visual feedback to show file processing progress and results:

#### Features
- **Progress Bar**: Real-time progress indicator showing percentage completion
- **Status Log**: Detailed console-style log showing each file's processing status
- **Success/Error Icons**: Visual indicators (✓, ✗, ⟳) for different operation states
- **Final Summary**: Color-coded results summary showing overall success/failure
- **Error Handling**: Clear error messages and graceful failure handling

#### Implementation Details
- Dynamic progress tracking with smooth animations
- Color-coded status messages (green for success, red for errors, yellow for processing)
- Scrollable status log with auto-scroll to latest updates
- Responsive design that works on all screen sizes
- Light/dark mode support with appropriate color schemes

#### Status Indicators
- **✓ Green**: Successful operations
- **✗ Red**: Failed operations  
- **⟳ Yellow**: Currently processing
- **Summary Cards**: Final results with appropriate styling

#### Benefits
- **Real-time Feedback**: Users can see exactly what's happening
- **Error Transparency**: Clear indication of what failed and why
- **Progress Awareness**: Know how much work is remaining
- **Professional UX**: Modern, polished interface experience

### Files Modified for Visual Feedback
1. `metronome/server/views/index.ejs` - Added progress bar and status containers
2. `metronome/server/public/opus_parser.js` - Implemented progress tracking and status updates
3. `metronome/server/public/style.css` - Added comprehensive styling for feedback elements

### Files Modified for Folder Selection
1. `metronome/server/views/index.ejs` - Added radio button interface for selection mode
2. `metronome/server/public/main.js` - Added toggle functionality and dynamic UI updates
3. `metronome/server/public/opus_parser.js` - Enhanced file filtering for opus files
4. `metronome/server/public/style.css` - Added styling for radio button interface

## Version Control Setup

### Git Ignore Configuration
Added comprehensive `.gitignore` files to exclude unnecessary files from version control:

#### Root .gitignore (`metronome/.gitignore`)
- **Node.js Dependencies**: `node_modules/`, npm/yarn/pnpm debug logs
- **macOS System Files**: `.DS_Store`, `._*`, `.Spotlight-V100`, `.Trashes`
- **Build Output**: `dist/`, `build/`, `.cache/`
- **Environment Files**: `.env*` files
- **IDE Files**: `.vscode/`, `.idea/`, `.sublime-*`
- **OS Files**: Windows `Thumbs.db`, Linux temporary files
- **Archive Files**: `*.zip`, `*.tar`, `*.gz`, etc.
- **Database Files**: `*.sqlite`, `*.db`

#### Server .gitignore (`metronome/server/.gitignore`)
- **Server Dependencies**: Server-specific `node_modules/`
- **Generated Files**: `undefined.json`, temporary uploads
- **Runtime Data**: Process IDs, log files
- **Upload Directories**: `uploads/`, `json/`

#### Benefits
- **Clean Repository**: No tracking of generated or system files
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Security**: Prevents accidental commit of environment variables
- **Performance**: Faster git operations with fewer files

### Files Added
1. `metronome/.gitignore` - Main project ignore rules
2. `metronome/server/.gitignore` - Server-specific ignore rules