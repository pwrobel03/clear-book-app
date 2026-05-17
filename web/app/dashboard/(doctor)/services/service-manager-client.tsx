"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Stethoscope,
  Pencil,
  X,
  List,
} from "lucide-react";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDoctorServiceAction,
  getMyServicesAction,
  updateDoctorServiceAction,
  deactivateDoctorServiceAction,
  type DoctorServiceResponse,
} from "@/lib/actions/schedule";

export function ServiceManagerClient() {
  const [services, setServices] = useState<DoctorServiceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stany formularza
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("150");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stan edycji i usuwania
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    const result = await getMyServicesAction();

    if (!result.error && result.data) {
      const activeServices = result.data.filter((s) => {
        const isActive = s.active !== false && (s as any).isActive !== false;
        return isActive;
      });

      setServices(activeServices);
    } else {
      console.error("Błąd pobierania:", result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const resetForm = () => {
    setName("");
    setDuration("30");
    setPrice("150");
    setEditingId(null);
  };

  const handleEditClick = (service: DoctorServiceResponse) => {
    setName(service.name);
    setDuration(service.durationMinutes.toString());
    setPrice(service.price.toString());
    setEditingId(service.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !duration || !price)
      return toast.error("Please fill all fields");

    setIsSubmitting(true);
    const payload = {
      name,
      durationMinutes: parseInt(duration),
      price: parseFloat(price),
    };

    let result;
    if (editingId) {
      result = await updateDoctorServiceAction(editingId, payload);
    } else {
      result = await createDoctorServiceAction(payload);
    }

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(editingId ? "Service updated!" : "Service added!");
      resetForm();
      fetchServices();
    }
    setIsSubmitting(false);
  };

  const handleDeactivate = async (id: string) => {
    setProcessingId(id);
    const result = await deactivateDoctorServiceAction(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.data?.message || "Service deactivated.");
      fetchServices();
    }
    setProcessingId(null);
  };

  return (
    <>
      {/* SEKCJA 1: FORMULARZ (GlassCard 1) */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 dark:bg-primary/20 shadow-inner">
            <Stethoscope
              size={26}
              className="text-primary dark:text-primary-light"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Service Configuration
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Define the medical services you offer to your patients.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {editingId && (
            <div className="absolute -top-6 right-0 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Pencil size={12} /> Editing Service
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-foreground">
              Service Name
            </label>
            <Input
              placeholder="e.g. Cardiology Consultation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-12 rounded-xl bg-accent/5 dark:bg-accent/10 border-accent/20 focus-visible:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-foreground">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min="5"
                step="5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2 h-12 rounded-xl bg-accent/5 dark:bg-accent/10 border-accent/20"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-foreground">
                Price (PLN)
              </label>
              <Input
                type="number"
                min="0"
                step="10"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-2 h-12 rounded-xl bg-accent/5 dark:bg-accent/10 border-accent/20"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl h-12 text-base shadow-md"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : editingId ? (
                <Pencil className="mr-2" size={18} />
              ) : (
                <Plus className="mr-2" size={18} />
              )}
              {editingId ? "Save Changes" : "Add Service"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="rounded-xl px-6 h-12 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </GlassCard>

      {/* SEKCJA 2: LISTA USŁUG (GlassCard 2) */}
      <GlassPanel className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <List size={20} className="text-muted-foreground" />
          Active Services
        </h3>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2
                className="animate-spin text-muted-foreground"
                size={24}
              />
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 dark:bg-accent/10 px-8 py-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No services added yet. Fill the form above to create one.
              </p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${editingId === service.id ? "border-primary bg-primary/5" : "border-black/5 dark:border-white/10 bg-background/60 hover:shadow-md"}`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-base text-foreground">
                    {service.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-sm font-medium text-muted-foreground">
                    <span className="bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-md">
                      {service.durationMinutes} min
                    </span>
                    <span>•</span>
                    <span className="text-primary font-bold">
                      {service.price} PLN
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    onClick={() => handleEditClick(service)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                    onClick={() => handleDeactivate(service.id)}
                    disabled={processingId === service.id}
                  >
                    {processingId === service.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </>
  );
}
