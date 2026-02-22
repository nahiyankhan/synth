import { handleToolSearch } from "../types/aiTools";

export interface ToolSearchHandler {
  args: any;
  functionCall: any;
  sessionPromiseRef: React.MutableRefObject<any> | null;
  addLog: (message: string) => void;
  showResult?: (result: any) => void;
}

export async function handleToolSearchCall({
  args,
  functionCall,
  sessionPromiseRef,
  addLog,
  showResult,
}: ToolSearchHandler): Promise<boolean> {
  const searchResult = await handleToolSearch(args);

  if (searchResult.success && searchResult.data) {
    addLog(`🔍 ${searchResult.message}`);

    // Display results in console for debugging
    console.log("🔍 Tool search results:", searchResult.data);

    // Show detailed results in the logs
    if (searchResult.data.results && searchResult.data.results.length > 0) {
      addLog(`📋 Found ${searchResult.data.results.length} tools:`);
      searchResult.data.results.forEach((tool: any, idx: number) => {
        addLog(
          `  ${idx + 1}. ${tool.name} - ${tool.description.substring(0, 80)}...`
        );
      });

      if (
        searchResult.data.newly_loaded &&
        searchResult.data.newly_loaded.length > 0
      ) {
        addLog(`✅ Loaded: ${searchResult.data.newly_loaded.join(", ")}`);
      }
    } else {
      addLog("❌ No matching tools found");
    }

    if (sessionPromiseRef?.current) {
      const session = await sessionPromiseRef.current;
      session.sendToolResponse({
        functionResponses: [
          {
            id: functionCall.id,
            name: functionCall.name,
            response: searchResult.data,
          },
        ],
      });
    }
  } else {
    addLog(`❌ Tool search failed: ${searchResult.message || "Unknown error"}`);
  }
  return true;
}
