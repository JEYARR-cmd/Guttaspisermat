import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus } from "lucide-react";

interface AddRestaurantDialogProps {
  participants: string[];
  onAdd: (name: string, responsible: string, date?: string) => void;
}

export function AddRestaurantDialog({ participants, onAdd }: AddRestaurantDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [responsible, setResponsible] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && responsible) {
      onAdd(name.trim(), responsible, date || undefined);
      setName("");
      setResponsible("");
      setDate("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          <Plus className="size-4 mr-2" />
          Legg til restaurant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til ny restaurant</DialogTitle>
          <DialogDescription>
            Legg til en ny restaurant for å rangere den sammen med gruppen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurantnavn</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Eldhuset"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsible">Ansvarlig deltager</Label>
            <Select value={responsible} onValueChange={setResponsible} required>
              <SelectTrigger id="responsible">
                <SelectValue placeholder="Velg deltager" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant} value={participant}>
                    {participant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Dato (valgfritt)</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Legg til
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}