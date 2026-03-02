import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronDown, ChevronUp, Calendar, User } from "lucide-react";
import { Input } from "./ui/input";

export interface Restaurant {
  id: string;
  name: string;
  responsible: string;
  date?: string;
  dateUnknown?: boolean;
  ratings: {
    [participant: string]: {
      verdi: number;
      smak: number;
      xFaktor: number;
    };
  };
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  participants: string[];
  currentParticipant: string;
  onRatingChange: (restaurantId: string, category: 'verdi' | 'smak' | 'xFaktor', value: number) => void;
  onDateChange: (restaurantId: string, date: string) => void;
  onSaveRating: (restaurantId: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving?: boolean;
}

export function RestaurantCard({ restaurant, participants, currentParticipant, onRatingChange, onDateChange, onSaveRating, isOpen, onOpenChange, isSaving }: RestaurantCardProps) {
  const currentRatings = restaurant.ratings[currentParticipant] || { verdi: 5, smak: 5, xFaktor: 5 };
  const isDisabled = currentParticipant === 'Ingen';

  const handleOpenChange = (open: boolean) => {
    // Prevent opening accordion if no participant is selected
    if (isDisabled && open) return;
    
    // If closing accordion, auto-save any changes
    if (!open && !isDisabled && currentParticipant !== 'Ingen') {
      onSaveRating(restaurant.id);
    }
    
    onOpenChange(open);
  };

  // Calculate average ratings
  const calculateAverage = (category: 'verdi' | 'smak' | 'xFaktor') => {
    const ratings = Object.values(restaurant.ratings).map(r => r[category]);
    if (ratings.length === 0) return 0;
    return (ratings.reduce((sum, val) => sum + val, 0) / ratings.length).toFixed(1);
  };

  const avgVerdi = calculateAverage('verdi');
  const avgSmak = calculateAverage('smak');
  const avgXFaktor = calculateAverage('xFaktor');
  const totalAvg = ((parseFloat(avgVerdi) + parseFloat(avgSmak) + parseFloat(avgXFaktor)) / 3).toFixed(1);
  
  const hasRatings = Object.keys(restaurant.ratings).length > 0;
  const missingRating = !restaurant.ratings[currentParticipant];
  
  // Calculate user's own average score
  const currentParticipantHasRated = currentParticipant !== 'Ingen' && restaurant.ratings[currentParticipant];
  const userAvg = currentParticipantHasRated 
    ? ((currentRatings.verdi + currentRatings.smak + currentRatings.xFaktor) / 3).toFixed(1)
    : null;

  return (
    <div className="flex gap-3">
      {/* Average Score Card */}
      <Card className="shrink-0 w-20 flex items-center justify-center self-stretch">
        <CardContent className="p-3 flex items-center justify-center h-full">
          <div className="text-center">
            <div className={`text-2xl font-bold tabular-nums ${hasRatings ? 'text-blue-600' : 'text-muted-foreground'}`}>
              {hasRatings ? totalAvg : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Snitt
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restaurant Card */}
      <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="flex-1 flex">
        <Card className="w-full flex flex-col overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className={`pb-3 flex-1 ${!isDisabled ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'} transition-colors`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`text-2xl font-bold tabular-nums shrink-0 ${userAvg ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {userAvg || '—'}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <User className="size-3" />
                      {restaurant.responsible}
                    </Badge>
                    {isSaving && isOpen && (
                      <Badge variant="outline" className="text-xs animate-pulse">
                        Lagrer...
                      </Badge>
                    )}
                    {!restaurant.date && (
                      <span className="text-sm text-muted-foreground">Dato ukjent</span>
                    )}
                  </div>
                </div>
                {!isDisabled && (
                  <div className="ml-2 shrink-0">
                    {isOpen ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                  </div>
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* Date Section */}
              <div className="mb-4">
                <Label htmlFor={`date-${restaurant.id}`} className="text-sm flex items-center gap-2 mb-2">
                  <Calendar className="size-4 text-gray-700 dark:text-gray-300" />
                  Besøksdato
                </Label>
                <Input
                  id={`date-${restaurant.id}`}
                  type="date"
                  value={restaurant.date || ''}
                  onChange={(e) => onDateChange(restaurant.id, e.target.value)}
                  className="w-[200px]"
                />
                {!restaurant.date && (
                  <span className="text-sm text-muted-foreground mt-1 block">Dato ukjent</span>
                )}
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Verdi</Label>
                      <span className="text-sm font-medium tabular-nums">{currentRatings.verdi}</span>
                    </div>
                    <Slider
                      value={[currentRatings.verdi]}
                      onValueChange={(value) => onRatingChange(restaurant.id, 'verdi', value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                      disabled={isDisabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Smak</Label>
                      <span className="text-sm font-medium tabular-nums">{currentRatings.smak}</span>
                    </div>
                    <Slider
                      value={[currentRatings.smak]}
                      onValueChange={(value) => onRatingChange(restaurant.id, 'smak', value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                      disabled={isDisabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">X-faktor</Label>
                      <span className="text-sm font-medium tabular-nums">{currentRatings.xFaktor}</span>
                    </div>
                    <Slider
                      value={[currentRatings.xFaktor]}
                      onValueChange={(value) => onRatingChange(restaurant.id, 'xFaktor', value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                      disabled={isDisabled}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}