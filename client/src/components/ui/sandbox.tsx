"use client";
import { cn } from "~/lib/utils";
import type {
  CodeEditorProps,
  PreviewProps,
  SandpackLayoutProps,
  SandpackProviderProps,
} from "@codesandbox/sandpack-react";
import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackTests,
  useSandpackNavigation,
} from "@codesandbox/sandpack-react";
import { RotateCwIcon } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  HTMLAttributes,
  ReactNode,
} from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
export type SandboxProviderProps = SandpackProviderProps;
export const SandboxProvider = ({
  className,
  ...props
}: SandpackProviderProps): ReactNode => (
  <div className={cn("size-full", className)}>
    <SandpackProvider className="size-full! max-h-none!" {...props} />
  </div>
);
export type SandboxLayoutProps = SandpackLayoutProps;
export const SandboxLayout = ({
  className,
  ...props
}: SandpackLayoutProps): ReactNode => (
  <SandpackLayout
    className={cn(
      "h-full! rounded-none! border-none! bg-transparent!",
      className,
    )}
    {...props}
  />
);
export type SandboxTabsContextValue = {
  selectedTab: string | undefined;
  setSelectedTab: (value: string) => void;
};
const SandboxTabsContext = createContext<SandboxTabsContextValue | undefined>(
  undefined,
);
const useSandboxTabsContext = () => {
  const context = useContext(SandboxTabsContext);
  if (!context) {
    throw new Error(
      "SandboxTabs components must be used within a SandboxTabsProvider",
    );
  }
  return context;
};
export type SandboxTabsProps = HTMLAttributes<HTMLDivElement> & {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};
export const SandboxTabs = ({
  className,
  defaultValue,
  value,
  onValueChange,
  ...props
}: SandboxTabsProps): ReactNode => {
  const [selectedTab, setSelectedTabState] = useState(value ?? defaultValue);
  useEffect(() => {
    if (value !== undefined) {
      setSelectedTabState(value);
    }
  }, [value]);
  const setSelectedTab = useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setSelectedTabState(newValue);
      }
      onValueChange?.(newValue);
    },
    [value, onValueChange],
  );
  return (
    <SandboxTabsContext.Provider value={{ selectedTab, setSelectedTab }}>
      <div
        className={cn(
          "group relative flex size-full flex-col overflow-hidden rounded-lg border text-sm",
          className,
        )}
        {...props}
        data-selected={selectedTab}
      >
        {props.children}
      </div>
    </SandboxTabsContext.Provider>
  );
};
export type SandboxTabsListProps = HTMLAttributes<HTMLDivElement>;
export const SandboxTabsList = ({
  className,
  ...props
}: SandboxTabsListProps): ReactNode => (
  <div
    className={cn(
      "bg-secondary text-muted-foreground inline-flex w-full shrink-0 items-center justify-start border-b p-2",
      className,
    )}
    role="tablist"
    {...props}
  />
);
export type SandboxTabsTriggerProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> & {
  value: string;
};
export const SandboxTabsTrigger = ({
  className,
  value,
  ...props
}: SandboxTabsTriggerProps): ReactNode => {
  const { selectedTab, setSelectedTab } = useSandboxTabsContext();
  const handleClick = useCallback(() => {
    setSelectedTab(value);
  }, [setSelectedTab, value]);
  return (
    <button
      aria-selected={selectedTab === value}
      className={cn(
        "ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow",
        className,
      )}
      data-state={selectedTab === value ? "active" : "inactive"}
      onClick={handleClick}
      role="tab"
      {...props}
    />
  );
};
export type SandboxTabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
};
export const SandboxTabsContent = ({
  className,
  value,
  ...props
}: SandboxTabsContentProps): ReactNode => {
  const { selectedTab } = useSandboxTabsContext();
  const isActive = selectedTab === value;
  return (
    <div
      aria-hidden={!isActive}
      className={cn(
        "ring-offset-background focus-visible:ring-ring flex-1 overflow-y-auto transition-opacity duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        isActive ? "opacity-100" : "hidden",
        className,
      )}
      data-state={isActive ? "active" : "inactive"}
      role="tabpanel"
      {...props}
    />
  );
};
export type SandboxCodeEditorProps = CodeEditorProps;
export const SandboxCodeEditor = ({
  showTabs = true,
  readOnly = false,
  ...props
}: SandboxCodeEditorProps): ReactNode => (
  <SandpackCodeEditor showTabs={showTabs} readOnly={readOnly} {...props} />
);
export type SandboxConsoleProps = Parameters<typeof SandpackConsole>[0];
export const SandboxConsole = ({
  className,
  ...props
}: SandboxConsoleProps): ReactNode => (
  <SandpackConsole className={cn("h-full", className)} {...props} />
);
export type SandboxPreviewProps = PreviewProps & {
  className?: string;
};
export const SandboxPreview = ({
  className,
  showOpenInCodeSandbox = false,
  ...props
}: SandboxPreviewProps): ReactNode => (
  <SandpackPreview
    className={cn("h-full", className)}
    showOpenInCodeSandbox={showOpenInCodeSandbox}
    {...props}
  />
);
export type SandboxTestsProps = ComponentProps<typeof SandpackTests>;
export const SandboxTests = ({
  className,
  ...props
}: SandboxTestsProps): ReactNode => (
  <SandpackTests className={cn("h-full", className)} {...props} />
);
export type SandboxFileExplorerProps = ComponentProps<
  typeof SandpackFileExplorer
>;
export const SandboxFileExplorer = ({
  autoHiddenFiles = true,
  className,
  ...props
}: SandboxFileExplorerProps): ReactNode => (
  <SandpackFileExplorer
    autoHiddenFiles={autoHiddenFiles}
    className={cn("h-full", className)}
    {...props}
  />
);

export type SandboxRefreshButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> & {
  onRefresh?: () => void;
};
export const SandboxRefreshButton = ({
  className,
  onRefresh,
  children,
  ...props
}: SandboxRefreshButtonProps): ReactNode => {
  const { refresh } = useSandpackNavigation();

  const handleClick = useCallback(() => {
    refresh();
    onRefresh?.();
  }, [refresh, onRefresh]);

  return (
    <button
      aria-label="Refresh preview"
      className={cn(
        "hover:bg-muted focus-visible:ring-ring inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={handleClick}
      tabIndex={0}
      type="button"
      {...props}
    >
      {children ?? (
        <>
          <RotateCwIcon size={14} />
          <span>Refresh</span>
        </>
      )}
    </button>
  );
};
