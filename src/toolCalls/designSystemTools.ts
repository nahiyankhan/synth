import { StyleGraph } from "@/core/StyleGraph";
import { IToolHandlers } from "@/context/DesignLanguageDataContext";

export interface DesignSystemToolHandler {
  functionCall: any;
  toolHandlers: IToolHandlers;
  sessionPromiseRef: React.MutableRefObject<any> | null;
  addLog: (message: string) => void;
  graph: StyleGraph | null;
  refreshUI: () => void;
  setVoiceSearchResults: (results: any) => void;
  showResult: (result: any) => void;
}

const MODIFYING_OPS = [
  "updateToken",
  "createToken",
  "deleteToken",
  "undoChange",
  "redoChange",
];

export async function handleDesignSystemTool({
  functionCall,
  toolHandlers,
  sessionPromiseRef,
  addLog,
  graph,
  refreshUI,
  setVoiceSearchResults,
  showResult,
}: DesignSystemToolHandler): Promise<void> {
  console.log("🔧 Calling tool handler:", functionCall.name, functionCall.args);

  // Keep toolArgs as-is - execute_operation expects nested params
  const toolArgs = functionCall.args;

  console.log("🔧 Final toolArgs being passed:", toolArgs);
  const result = await toolHandlers.handleTool(functionCall.name, toolArgs);

  console.log("🔧 Tool result:", result);

  if (!result.success) {
    addLog(`❌ ${result.error || "Tool execution failed"}`);
    console.error("❌ Tool failed:", result.error);
    return;
  }

  addLog(`✓ ${result.message || "Success"}`);

  const isModifyingOp =
    MODIFYING_OPS.includes(functionCall.name) ||
    (functionCall.name === "execute_operation" &&
      MODIFYING_OPS.includes(functionCall.args?.operation));

  if (isModifyingOp) {
    console.log("🔄 Refreshing UI");
    refreshUI();
  }

  // Show specialized UIs for certain operations
  console.log("📦 Importing toolUIHelpers...");
  const {
    showModificationResult,
    showImpactAnalysis,
    showSystemAnalysis,
    showHistoryOperation,
    showExportResult,
  } = await import("../utils/toolUIHelpers");
  console.log("📦 toolUIHelpers imported");

  // For direct tool calls, operation name IS the function name
  // For execute_operation, extract from params
  const operation =
    functionCall.name === "execute_operation"
      ? toolArgs.operation
      : functionCall.name;

  // Extract params - direct calls use toolArgs directly, execute_operation uses toolArgs.params
  const actualParams =
    functionCall.name === "execute_operation" ? toolArgs.params : toolArgs;

  console.log("🔍 DEBUG: Tool executed", {
    operation,
    hasData: !!result.data,
    functionName: functionCall.name,
    actualParams,
    resultData: result.data,
  });

  // Show discovery results (get_design_system_operations, get_operation_info)
  if (operation === "get_design_system_operations" && result.data) {
    console.log("📚 Showing operations list", result.data);
    const operations = result.data.operations || [];
    const operationsByCategory = operations.reduce((acc: any, op: any) => {
      if (!acc[op.category]) acc[op.category] = [];
      acc[op.category].push(op);
      return acc;
    }, {});

    showResult({
      type: "system-analysis",
      timestamp: Date.now(),
      toolName: "get_design_system_operations",
      systemAnalysis: {
        timestamp: Date.now(),
        category: "all",
        usage: {
          mostUsedSpecs: [],
          leastUsedSpecs: [],
          mostUsedTokens: [],
          orphanedTokens: [],
          usageDistribution: Object.entries(operationsByCategory).map(
            ([cat, ops]: [string, any]) => ({
              range: cat,
              count: ops.length,
            })
          ),
        },
        insights: {
          executiveSummary: `Found ${
            operations.length
          } available operations across ${
            Object.keys(operationsByCategory).length
          } categories:\n\n${Object.entries(operationsByCategory)
            .map(
              ([cat, ops]: [string, any]) =>
                `• ${cat}: ${ops.map((o: any) => o.name).join(", ")}`
            )
            .join("\n")}`,
          topRecommendations: Object.keys(operationsByCategory).map(
            (cat: string) => `${cat} operations available`
          ),
          riskAssessment: "All operations are available and ready to use",
          healthScore: 100,
          estimatedImpact: `${operations.length} total operations available`,
        },
        summary: {
          totalTokens: operations.length,
          coreTokens: Object.keys(operationsByCategory).length,
          specs: 0,
          issuesFound: 0,
          opportunitiesFound: operations.length,
        },
      },
    });
  } else if (operation === "get_operation_info" && result.data) {
    console.log("📚 Showing operation info", result.data);
    const opData = result.data;
    showResult({
      type: "system-analysis",
      timestamp: Date.now(),
      toolName: "get_operation_info",
      systemAnalysis: {
        timestamp: Date.now(),
        category: "all",
        insights: {
          executiveSummary: `Operation: ${opData.operation}\n\nCategory: ${
            opData.category
          }\n\nDescription: ${
            opData.description
          }\n\nParameters: ${JSON.stringify(opData.parameters, null, 2)}`,
          topRecommendations: opData.returns
            ? [`Returns: ${opData.returns}`]
            : [],
          riskAssessment: opData.sideEffects || "No side effects documented",
          healthScore: 100,
          estimatedImpact: opData.returns || "See description",
        },
        summary: {
          totalTokens: 1,
          coreTokens: 1,
          specs: 0,
          issuesFound: 0,
          opportunitiesFound: 1,
        },
      },
    });
  }

  // Filter main UI instead of showing overlay
  else if (
    (operation === "searchTokens" || operation === "findAllReferences") &&
    result.data
  ) {
    console.log("🔍 Filtering main UI with search results", result.data);
    
    // Convert search result tokens to StyleNodes for filtering the main view
    const searchResults = result.data.tokens
      ?.map((token: any) => {
        try {
          return graph?.getNode(token.path);
        } catch {
          return null;
        }
      })
      .filter((n: any) => n !== null);

    setVoiceSearchResults(searchResults);
    addLog(`🔍 Found ${searchResults?.length || 0} matching tokens - filtered in main view`);
  }

  // Show modification results
  else if (operation === "createToken" && result.data) {
    console.log("📝 Showing create token UI");
    showModificationResult(showResult, {
      operation: "create",
      path: result.data.path || actualParams.path,
      newValue: result.data.value || actualParams.value,
      success: true,
      timestamp: Date.now(),
      message: result.message,
    });
  } else if (operation === "updateToken" && result.data) {
    console.log("📝 Showing update token UI", { result, actualParams });
    showModificationResult(showResult, {
      operation: "update",
      path: result.data.path || actualParams.path,
      oldValue: result.data.oldValue,
      newValue: result.data.value || result.data.newValue || actualParams.value,
      success: true,
      timestamp: Date.now(),
      message: result.message,
      affectedDependents: result.data.dependents?.length,
    });
  } else if (operation === "deleteToken") {
    console.log("📝 Showing delete token UI");
    showModificationResult(showResult, {
      operation: "delete",
      path: actualParams.path,
      oldValue: result.data?.value,
      success: true,
      timestamp: Date.now(),
      message: result.message,
      affectedDependents: result.data?.dependents?.length,
    });
  } else if (operation === "renameToken") {
    console.log("📝 Showing rename token UI");
    showModificationResult(showResult, {
      operation: "rename",
      path: actualParams.newPath,
      oldPath: actualParams.oldPath,
      success: true,
      timestamp: Date.now(),
      message: result.message,
      affectedDependents: result.data?.updatedReferences,
    });
  }

  // Show impact analysis
  else if (operation === "getImpactAnalysis" && result.data) {
    showImpactAnalysis(showResult, result.data, operation);
  }

  // Show system statistics
  else if (operation === "getSystemStats" && result.data) {
    console.log("📊 Showing system stats", result.data);
    const stats = result.data;
    // Wrap simple stats in DesignSystemAnalysis format for the UI
    showSystemAnalysis(
      showResult,
      {
        timestamp: Date.now(),
        category: "all",
        insights: {
          executiveSummary: `System contains ${
            stats.totalNodes
          } total tokens (${stats.coreTokens} core tokens, ${
            stats.designSpecs
          } specs). Maximum dependency depth: ${stats.maxDepth}. ${
            stats.circularDependencies > 0
              ? `Warning: ${stats.circularDependencies} circular dependencies detected.`
              : "No circular dependencies detected."
          }`,
          topRecommendations: [
            `Total tokens: ${stats.totalNodes}`,
            `Core tokens: ${stats.coreTokens}`,
            `Design specs: ${stats.designSpecs}`,
          ],
          riskAssessment:
            stats.circularDependencies > 0
              ? `${stats.circularDependencies} circular dependencies need attention`
              : "System structure looks healthy",
          healthScore: stats.circularDependencies > 0 ? 70 : 100,
          estimatedImpact: `Depth: ${stats.maxDepth} levels`,
        },
        summary: {
          totalTokens: stats.totalNodes,
          coreTokens: stats.coreTokens,
          specs: stats.designSpecs,
          issuesFound: stats.circularDependencies || 0,
          opportunitiesFound: 0,
        },
      },
      operation
    );
  }

  // Show design system analysis
  else if (operation === "analyzeDesignSystem" && result.data) {
    showSystemAnalysis(showResult, result.data, operation);
  }

  // Show history operations
  else if (operation === "undoChange") {
    showHistoryOperation(
      showResult,
      "undo",
      result.message || "Change undone",
      result.data?.affectedTokens || []
    );
  } else if (operation === "redoChange") {
    showHistoryOperation(
      showResult,
      "redo",
      result.message || "Change redone",
      result.data?.affectedTokens || []
    );
  }

  // Show export result
  else if (operation === "exportDesignSystem" && result.data) {
    console.log("📝 Showing export UI");
    const tokenCount = graph?.getStats().totalNodes || 0;
    showExportResult(
      showResult,
      actualParams.format || "json",
      JSON.stringify(result.data, null, 2),
      tokenCount
    );
  }

  const isSearchOperation =
    functionCall.name === "searchTokens" ||
    (functionCall.name === "execute_operation" &&
      functionCall.args?.operation === "searchTokens");

  if (isSearchOperation && result.data?.tokens) {
    const searchResults = result.data.tokens
      .map((tokenInfo: any) => {
        // tokenInfo.path is now a node ID
        return graph?.getNode(tokenInfo.path);
      })
      .filter((n: any) => n !== null);

    setVoiceSearchResults(searchResults);
    addLog(`📊 Showing ${searchResults.length} voice search results in UI`);
  }

  if (sessionPromiseRef?.current) {
    const session = await sessionPromiseRef.current;
    session.sendToolResponse({
      functionResponses: [
        {
          id: functionCall.id,
          name: functionCall.name,
          response: result.data || { success: true },
        },
      ],
    });
  }
}
