import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class FetchXmlControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;
    private context: ComponentFramework.Context<IInputs>;
    private notifyOutputChanged: () => void;
    private fetchXml: string;

    constructor() {
        // Empty
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this.context = context;
        this.notifyOutputChanged = notifyOutputChanged;
        this.container = container;
        this.fetchXml = context.parameters.inputvalue.raw ?? "";
        
        // Initialize UI
        this.renderUI();
    }

    private async renderUI(): Promise<void> {
        const resultDiv = document.createElement("div");
        resultDiv.style.marginTop = "10px";
        const results = await this.executeFetchXML(this.fetchXml);
        this.displayResults(results, resultDiv);
        this.container.appendChild(resultDiv);
    }

    private async executeFetchXML(fetchXml: string): Promise<ComponentFramework.WebApi.Entity[]> {
        try {
            const entityNameMatch = fetchXml.match(/<entity name=["'](.*?)["']/);
            if (!entityNameMatch) {
                throw new Error("Invalid FetchXML format. Please provide a valid entity name.");
            }
            
            const entityName = entityNameMatch[1];
            //const query = `?fetchXml=${encodeURIComponent(fetchXml)}`;

            const fetchQuery = `?fetchXml=${fetchXml}`;
            const response = await this.context.webAPI.retrieveMultipleRecords(entityName, fetchQuery);
            return response.entities;
        } catch (error) {
            console.error("Error executing FetchXML:", error);
            return [];
        }
    }

    private displayResults(results: ComponentFramework.WebApi.Entity[], resultDiv: HTMLDivElement): void {
        resultDiv.innerHTML = ""; // Clear old results
        if (results.length === 0) {
            resultDiv.innerText = "No records found.";
            return;
        }

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.border = "1px solid black";
        table.style.textAlign = "left";
        table.style.marginTop = "10px";
        
        const headerRow = document.createElement("tr");
        Object.keys(results[0]).forEach(key => {
            const th = document.createElement("th");
            th.innerText = key;
            th.style.border = "1px solid black";
            th.style.padding = "5px";
            th.style.backgroundColor = "#f2f2f2";
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        
        results.forEach(record => {
            const row = document.createElement("tr");
            Object.values(record).forEach(value => {
                const td = document.createElement("td");
                td.innerText = value !== null && value !== undefined 
                ? (typeof value === "object" ? JSON.stringify(value) : String(value)) 
                : "";                td.style.border = "1px solid black";
                td.style.padding = "5px";
                row.appendChild(td);
            });
            table.appendChild(row);
        });

        resultDiv.appendChild(table);
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        // Add code to update control view
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
