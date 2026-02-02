import { IncidentForm } from "@/types";
import { FormField, BooleanField } from "@/components/FormField";

interface IncidentFormTabProps {
  form: IncidentForm;
  isActive: boolean;
}

export function IncidentFormTab({ form, isActive }: IncidentFormTabProps) {
  return (
    <div
      id="panel-form"
      role="tabpanel"
      aria-labelledby="tab-form"
      className={`space-y-4 sm:space-y-6 ${isActive ? "block" : "hidden"}`}
      tabIndex={isActive ? 0 : -1}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Date and Time" value={form.date_and_time_of_incident} />
        <FormField label="Service User Name" value={form.service_user_name} />
        <FormField label="Location" value={form.location_of_incident} />
        <FormField label="Type of Incident" value={form.type_of_incident} />
      </div>
      <FormField
        label="Description"
        value={form.description_of_incident}
        multiline
      />
      <FormField
        label="Immediate Actions Taken"
        value={form.immediate_actions_taken}
        multiline
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BooleanField
          label="First Aid Administered"
          value={form.was_first_aid_administered}
        />
        <BooleanField
          label="Emergency Services Contacted"
          value={form.were_emergency_services_contacted}
        />
        <FormField label="Who Was Notified" value={form.who_was_notified} />
        <FormField label="Witnesses" value={form.witnesses} />
      </div>
      <FormField
        label="Agreed Next Steps"
        value={form.agreed_next_steps}
        multiline
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BooleanField
          label="Risk Assessment Needed"
          value={form.risk_assessment_needed}
        />
        {form.risk_assessment_needed && (
          <FormField
            label="Risk Assessment Type"
            value={form.if_yes_which_risk_assessment}
          />
        )}
      </div>
    </div>
  );
}
