import { Controller, Get } from "@nestjs/common";
import { roleCapabilities, resultWorkflowRules, sampleWorkflowRules } from "@lab/contracts";

@Controller("workflow")
export class WorkflowController {
  @Get("roles")
  getRoles() {
    return roleCapabilities;
  }

  @Get("samples")
  getSampleWorkflow() {
    return sampleWorkflowRules;
  }

  @Get("results")
  getResultWorkflow() {
    return resultWorkflowRules;
  }
}
