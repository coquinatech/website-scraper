---

Created Date: 2025-08-16

# Feature Plan: Standardize Chat Layout as Application Layout

# Overview

Currently, the application has two different layout systems - a simple MainLayout for general pages and a more sophisticated ChatLayout with a purple/teal themed design, custom navigation bar, and 3-panel structure. The ChatLayout provides a more modern and cohesive user experience that should be standardized across the entire application. This plan outlines migrating all pages to use the ChatLayout design system while making it flexible enough to accommodate different page requirements.

# Outcomes

- Unified visual design across all application pages using the purple/teal color scheme
- Consistent navigation experience with the enhanced header from ChatLayout
- Functional user dropdown menu with settings and logout actions
- Flexible layout system that adapts to different page needs (with/without sidebars)
- Settings page migrated to the new layout system
- Removal of duplicate layout code and simplified maintenance

# Open Questions

[ ] Should all pages have the 3-panel layout or should sidebars be optional per page?
[ ] Do we want to keep the "Recent Chats" sidebar visible on non-chat pages?
[ ] Should the workflow indicator in the sidebar be visible globally or only on chat?
[ ] Do we need the info panel on pages other than chat?
[ ] Should we maintain the notification bell functionality in the header?
[ ] What user information should be displayed in the header (name, email, avatar)?

# Tasks

## Phase 1: Extract and Refactor ChatLayout Components

[ ] Extract the navigation header from ChatLayout into a reusable AppHeader component
[ ] Move color scheme and styling constants to a shared theme configuration
[ ] Create a flexible AppLayout component that can toggle sidebars on/off
[ ] Extract the sidebar into a reusable AppSidebar component
[ ] Extract the info panel into a reusable InfoPanel component

## Phase 2: Enhance Header Functionality

[ ] Implement working user dropdown menu in AppHeader with:
  - User email/name display
  - Settings navigation link
  - Logout functionality with proper auth context integration
  - User avatar or initial display
[ ] Connect notification bell to actual notification system (or hide if not ready)
[ ] Ensure navigation tabs highlight correctly based on current route
[ ] Add responsive mobile menu functionality from ChatLayout

## Phase 3: Create Flexible Layout System

[ ] Create AppLayout component with props:
  - showLeftSidebar (boolean)
  - showRightPanel (boolean)
  - leftSidebarContent (ReactNode)
  - rightPanelContent (ReactNode)
  - children (main content)
[ ] Implement layout persistence preferences (collapsed states)
[ ] Add keyboard shortcuts for sidebar toggles (Cmd/Ctrl + B)
[ ] Ensure proper responsive behavior on mobile devices

## Phase 4: Migrate Existing Pages

[ ] Update App.tsx routing to use new AppLayout instead of MainLayout
[ ] Migrate DashboardPage to use AppLayout without sidebars
[ ] Migrate WorkflowsPage to use AppLayout with appropriate sidebars
[ ] Migrate SettingsPage to use AppLayout
[ ] Update ChatPage to use the new extracted components
[ ] Remove the old MainLayout component

## Phase 5: Settings Page Implementation

[ ] Design settings page layout within the new system
[ ] Implement settings navigation/categories in left sidebar
[ ] Create settings content area with proper styling
[ ] Ensure settings forms match the new design system
[ ] Test settings functionality with new layout

## Phase 6: Cleanup and Testing

[ ] Remove AuthLayout or update it to match new design system
[ ] Update any component imports to use new layout system
[ ] Test all navigation paths and ensure proper rendering
[ ] Verify authentication flow still works correctly
[ ] Test responsive behavior across all pages
[ ] Update any broken tests due to layout changes

# Security

- Ensure authentication state is properly checked before rendering protected layouts
- Verify logout functionality properly clears all sensitive data
- Confirm that route guards still function with new layout system
- Validate that user information displayed in header doesn't expose sensitive data

# Technical Architecture

## Component Structure
```
layouts/
  ├── AppLayout.tsx         # Main flexible layout wrapper
  ├── AppHeader.tsx         # Shared navigation header
  ├── AppSidebar.tsx        # Reusable sidebar component
  ├── InfoPanel.tsx         # Right information panel
  └── AuthLayout.tsx        # Updated auth pages layout

components/
  └── ui/
      └── theme.ts          # Shared color scheme and styling
```

## Layout Props Interface
```typescript
interface AppLayoutProps {
  showLeftSidebar?: boolean;
  showRightPanel?: boolean;
  leftSidebarContent?: ReactNode;
  rightPanelContent?: ReactNode;
  children: ReactNode;
}
```

## Color Scheme (from ChatLayout)
- Primary: Purple/Teal gradient theme
- Backgrounds: 
  - Sidebar: purple-50
  - Main: white
  - Info Panel: gray-50
- Accents:
  - Active items: purple-200/purple-900
  - CTAs: teal-500/teal-600
  - Gradients: pink-500 to teal-500

# Migration Strategy

1. Start by creating new components alongside existing ones
2. Test new components in isolation
3. Gradually migrate pages one at a time
4. Keep old components until all pages are migrated
5. Remove old components in final cleanup phase

This approach ensures the application remains functional throughout the migration process.