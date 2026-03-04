import { useState, useEffect } from "react";
import { RestaurantCard, Restaurant } from "./components/restaurant-card";
import { Scoreboard } from "./components/scoreboard";
import { AddRestaurantDialog } from "./components/add-restaurant-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Label } from "./components/ui/label";
import { ChefHat, Loader2, Settings, Moon, Sun } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";

const PARTICIPANTS = ["Jonas", "Asbjørn", "Morten", "Erik"];

const INITIAL_RESTAURANTS: Restaurant[] = [
  { id: "1", name: "Eldhuset", responsible: "Asbjørn", ratings: {} },
  { id: "2", name: "Dinner", responsible: "Morten", ratings: {} },
  { id: "3", name: "Der pepperen gror", responsible: "Jonas", ratings: {} },
  { id: "4", name: "Mehfel pakistansk", responsible: "Jonas", ratings: {} },
  { id: "5", name: "Brasilia", responsible: "Jonas", ratings: {} },
  { id: "6", name: "St. Lars", responsible: "Morten", ratings: {} },
  { id: "7", name: "Arakatakata", responsible: "Asbjørn", ratings: {} },
  { id: "8", name: "Tiffanys", responsible: "Asbjørn", ratings: {} },
  { id: "9", name: "Roald og umberto", responsible: "Erik", ratings: {} },
  { id: "10", name: "Glade gris", responsible: "Erik", ratings: {} },
  { id: "11", name: "Alex sushi", responsible: "Morten", ratings: {} },
  { id: "12", name: "Delicatessen", responsible: "Asbjørn", ratings: {} },
  { id: "13", name: "Izakaya", responsible: "Erik", ratings: {} },
  { id: "14", name: "Julebord hos Erik", responsible: "Erik", ratings: {} },
  { id: "15", name: "Hot temper", responsible: "Jonas", ratings: {} },
  { id: "16", name: "Beijing palace", responsible: "Asbjørn", ratings: {} },
  { id: "17", name: "Gangnam", responsible: "Erik", ratings: {} },
];

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-fbdf02f2`;

export default function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<string>('Ingen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [savingRestaurantId, setSavingRestaurantId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode
  });
  
  // Debounce timer for auto-save
  const [saveTimers, setSaveTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // Apply dark mode based on state
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Load restaurants from backend
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Loading restaurants from backend:", `${API_BASE}/restaurants`);
        
        const response = await fetch(`${API_BASE}/restaurants`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response error:", errorText);
          throw new Error(`Failed to load restaurants: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Loaded data from backend:", data);
        
        // If no restaurants exist in backend, initialize with default data
        if (!data.restaurants || data.restaurants.length === 0) {
          console.log("No restaurants found in backend, initializing with default restaurants...");
          
          const initResponse = await fetch(`${API_BASE}/restaurants/init`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({ restaurants: INITIAL_RESTAURANTS })
          });
          
          if (!initResponse.ok) {
            const errorText = await initResponse.text();
            console.error("Init error:", errorText);
            throw new Error(`Failed to initialize restaurants: ${initResponse.status} ${initResponse.statusText}`);
          }
          
          setRestaurants(INITIAL_RESTAURANTS);
        } else {
          // Use backend data as the source of truth
          setRestaurants(data.restaurants);
          console.log(`Loaded ${data.restaurants.length} restaurants from backend`);
        }
      } catch (err) {
        console.error("Error loading restaurants:", err);
        setError(err instanceof Error ? err.message : "Failed to load restaurants");
        // Fallback to initial restaurants only if backend completely fails
        setRestaurants(INITIAL_RESTAURANTS);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  // Update restaurant in backend
  const updateRestaurantInBackend = async (updatedRestaurant: Restaurant) => {
    try {
      const response = await fetch(`${API_BASE}/restaurants/${updatedRestaurant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ restaurant: updatedRestaurant })
      });

      if (!response.ok) {
        throw new Error(`Failed to update restaurant: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Error updating restaurant:", err);
      setError(err instanceof Error ? err.message : "Failed to update restaurant");
    }
  };

  const handleRatingChange = (restaurantId: string, category: 'verdi' | 'smak' | 'xFaktor', value: number) => {
    // Prevent rating changes if no participant is selected
    if (currentParticipant === 'Ingen') return;
    
    setRestaurants(prev => {
      const updated = prev.map(restaurant => {
        if (restaurant.id === restaurantId) {
          // Check if this is a rating change (not first time rating)
          const hadPreviousRating = !!restaurant.ratings[currentParticipant];
          
          const updatedRestaurant = {
            ...restaurant,
            ratings: {
              ...restaurant.ratings,
              [currentParticipant]: {
                ...restaurant.ratings[currentParticipant],
                verdi: category === 'verdi' ? value : restaurant.ratings[currentParticipant]?.verdi ?? 5,
                smak: category === 'smak' ? value : restaurant.ratings[currentParticipant]?.smak ?? 5,
                xFaktor: category === 'xFaktor' ? value : restaurant.ratings[currentParticipant]?.xFaktor ?? 5,
              }
            },
            // Replace change history if this is a modification (not first time)
            lastChange: hadPreviousRating ? {
              participant: currentParticipant,
              timestamp: new Date().toISOString()
            } : restaurant.lastChange
          };
          return updatedRestaurant;
        }
        return restaurant;
      });
      return updated;
    });
    
    // Debounced auto-save: Save 1 second after user stops dragging slider
    if (saveTimers[restaurantId]) {
      clearTimeout(saveTimers[restaurantId]);
    }
    
    const newTimer = setTimeout(() => {
      setSavingRestaurantId(restaurantId);
      
      setRestaurants(prev => {
        const restaurant = prev.find(r => r.id === restaurantId);
        if (restaurant) {
          updateRestaurantInBackend(restaurant).then(() => {
            setSavingRestaurantId(null);
            console.log(`Auto-saved restaurant: ${restaurant.name}`);
          });
        }
        return prev;
      });
      
      // Remove timer from state
      setSaveTimers(prevTimers => {
        const { [restaurantId]: _, ...rest } = prevTimers;
        return rest;
      });
    }, 1000); // Wait 1 second after last change
    
    setSaveTimers(prev => ({
      ...prev,
      [restaurantId]: newTimer
    }));
  };

  const handleSaveRating = (restaurantId: string) => {
    // Prevent saving if no participant is selected
    if (currentParticipant === 'Ingen') return;
    
    setRestaurants(prev => {
      const restaurant = prev.find(r => r.id === restaurantId);
      if (restaurant) {
        // Ensure the current participant has a rating (use defaults if not set)
        const updatedRestaurant = {
          ...restaurant,
          ratings: {
            ...restaurant.ratings,
            [currentParticipant]: restaurant.ratings[currentParticipant] || {
              verdi: 5,
              smak: 5,
              xFaktor: 5,
            }
          }
        };
        updateRestaurantInBackend(updatedRestaurant);
        
        const newState = prev.map(r => r.id === restaurantId ? updatedRestaurant : r);
        // Backup to localStorage
        localStorage.setItem('restaurants_backup', JSON.stringify(newState));
        return newState;
      }
      return prev;
    });
  };

  const handleDateChange = (restaurantId: string, date: string) => {
    setRestaurants(prev => {
      const updated = prev.map(restaurant => {
        if (restaurant.id === restaurantId) {
          const updatedRestaurant = {
            ...restaurant,
            date
          };
          updateRestaurantInBackend(updatedRestaurant);
          return updatedRestaurant;
        }
        return restaurant;
      });
      // Backup to localStorage
      localStorage.setItem('restaurants_backup', JSON.stringify(updated));
      return updated;
    });
  };

  const handleNameChange = (restaurantId: string, name: string) => {
    setRestaurants(prev => {
      const updated = prev.map(restaurant => {
        if (restaurant.id === restaurantId) {
          const updatedRestaurant = {
            ...restaurant,
            name
          };
          updateRestaurantInBackend(updatedRestaurant);
          return updatedRestaurant;
        }
        return restaurant;
      });
      // Backup to localStorage
      localStorage.setItem('restaurants_backup', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDateUnknownChange = (restaurantId: string, dateUnknown: boolean) => {
    setRestaurants(prev => {
      const updated = prev.map(restaurant => {
        if (restaurant.id === restaurantId) {
          const updatedRestaurant = {
            ...restaurant,
            dateUnknown,
            date: dateUnknown ? '' : restaurant.date
          };
          updateRestaurantInBackend(updatedRestaurant);
          return updatedRestaurant;
        }
        return restaurant;
      });
      // Backup to localStorage
      localStorage.setItem('restaurants_backup', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddRestaurant = async (name: string, responsible: string, date?: string) => {
    const newRestaurant: Restaurant = {
      id: Date.now().toString(),
      name,
      responsible,
      date,
      ratings: {}
    };
    
    try {
      const response = await fetch(`${API_BASE}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ restaurant: newRestaurant })
      });

      if (!response.ok) {
        throw new Error(`Failed to add restaurant: ${response.statusText}`);
      }

      setRestaurants(prev => {
        const newState = [...prev, newRestaurant];
        // Backup to localStorage
        localStorage.setItem('restaurants_backup', JSON.stringify(newState));
        return newState;
      });
    } catch (err) {
      console.error("Error adding restaurant:", err);
      setError(err instanceof Error ? err.message : "Failed to add restaurant");
    }
  };

  const handleResetAllRatings = async () => {
    try {
      // Reset all ratings to empty
      const resetRestaurants = restaurants.map(restaurant => ({
        ...restaurant,
        ratings: {}
      }));

      // Update state immediately for better UX
      setRestaurants(resetRestaurants);
      setSettingsOpen(false);

      // Try to update in backend (may fail if backend is not working)
      for (const restaurant of resetRestaurants) {
        try {
          await updateRestaurantInBackend(restaurant);
        } catch (err) {
          console.error(`Failed to update restaurant ${restaurant.name} in backend:`, err);
        }
      }
    } catch (err) {
      console.error("Error resetting ratings:", err);
      setError(err instanceof Error ? err.message : "Failed to reset ratings");
    }
  };

  // Calculate restaurant rankings
  const restaurantRankings = restaurants
    .map(restaurant => {
      const ratings = Object.values(restaurant.ratings);
      if (ratings.length === 0) return { name: restaurant.name, score: 0, rank: 0 };
      
      const avgScore = ratings.reduce((sum, rating) => {
        const restaurantAvg = (rating.verdi + rating.smak + rating.xFaktor) / 3;
        return sum + restaurantAvg;
      }, 0) / ratings.length;

      return { name: restaurant.name, score: avgScore, rank: 0 };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // Calculate participant rankings
  const participantRankings = PARTICIPANTS
    .map(participant => {
      // Find all restaurants this participant is responsible for
      const responsibleRestaurants = restaurants.filter(r => r.responsible === participant);
      if (responsibleRestaurants.length === 0) return { name: participant, score: 0, rank: 0 };

      // Calculate average score across all ratings for those restaurants
      let totalScore = 0;
      let totalCount = 0;

      responsibleRestaurants.forEach(restaurant => {
        const ratings = Object.values(restaurant.ratings);
        if (ratings.length > 0) {
          const restaurantAvgScore = ratings.reduce((sum, rating) => {
            const ratingAvg = (rating.verdi + rating.smak + rating.xFaktor) / 3;
            return sum + ratingAvg;
          }, 0) / ratings.length;
          
          totalScore += restaurantAvgScore;
          totalCount++;
        }
      });

      const avgScore = totalCount > 0 ? totalScore / totalCount : 0;
      return { name: participant, score: avgScore, rank: 0 };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // Sort restaurants based on selected criteria
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (sortBy === 'date') {
      // Restaurants with dates come first, sorted by date (newest first)
      // Then "dato ukjent", then no date
      if (a.dateUnknown && !b.dateUnknown) return 1;
      if (!a.dateUnknown && b.dateUnknown) return -1;
      if (a.dateUnknown && b.dateUnknown) return 0;
      
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      if (!a.date && !b.date) return 0;
      
      return new Date(b.date!).getTime() - new Date(a.date!).getTime();
    }
    
    if (sortBy === 'score') {
      // Calculate average score for each restaurant
      const getScore = (restaurant: Restaurant) => {
        const ratings = Object.values(restaurant.ratings);
        if (ratings.length === 0) return 0;
        const avgScore = ratings.reduce((sum, rating) => {
          const restaurantAvg = (rating.verdi + rating.smak + rating.xFaktor) / 3;
          return sum + restaurantAvg;
        }, 0) / ratings.length;
        return avgScore;
      };
      
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      
      // Restaurants with scores come first, sorted best to worst
      // Then restaurants without scores
      if (scoreA === 0 && scoreB === 0) return 0;
      if (scoreA === 0) return 1;  // a has no score, move to end
      if (scoreB === 0) return -1; // b has no score, move to end
      
      return scoreB - scoreA; // Both have scores, sort descending
    }
    
    // If sortBy is a participant name, show their restaurants first
    if (PARTICIPANTS.includes(sortBy)) {
      if (a.responsible === sortBy && b.responsible !== sortBy) return -1;
      if (a.responsible !== sortBy && b.responsible === sortBy) return 1;
      // Within each responsible group, maintain grouping by responsible
      if (a.responsible !== b.responsible) {
        return a.responsible.localeCompare(b.responsible);
      }
      // Within same group, maintain insertion order or date
      return 0;
    }
    
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ChefHat className="size-8 text-primary" />
                <h1 className="text-3xl lg:text-4xl font-bold">Gutta spiser mat 🥩🍲🍰🍺</h1>
              </div>
              <p className="text-muted-foreground">Oslos mest useriøse seriøse restauranttest</p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="participant">Rangerer som:</Label>
              <Select value={currentParticipant} onValueChange={setCurrentParticipant}>
                <SelectTrigger id="participant" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTICIPANTS.map((participant) => (
                    <SelectItem key={participant} value={participant}>
                      {participant}
                    </SelectItem>
                  ))}
                  <SelectItem value="Ingen">Ingen</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleDarkMode}
                title={darkMode ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
              >
                {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Dialog open={settingsOpen} onOpenChange={(open) => {
                setSettingsOpen(open);
                // Reset confirm state when dialog closes
                if (!open) setConfirmDelete(false);
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Innstillinger</DialogTitle>
                    <DialogDescription>
                      Administrer rangeringer og data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!confirmDelete ? (
                      <Alert className="bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800/50">
                        <AlertDescription className="text-sm text-red-900 dark:text-red-200">
                          <p className="font-semibold mb-2">⚠️ Advarsel!</p>
                          <p>Dette vil permanent slette alle rangeringer fra alle deltagere. Denne handlingen kan ikke angres.</p>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800/50">
                        <AlertDescription className="text-sm text-orange-900 dark:text-orange-200">
                          <p className="font-semibold mb-2">⚠️ Er du helt sikker?</p>
                          <p>Trykk på "Bekreft sletting" én gang til for å slette alle rangeringer permanent.</p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setSettingsOpen(false);
                      setConfirmDelete(false);
                    }}>
                      Avbryt
                    </Button>
                    {!confirmDelete ? (
                      <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                        Nullstill alle rangeringer
                      </Button>
                    ) : (
                      <Button variant="destructive" onClick={() => {
                        handleResetAllRatings();
                        setConfirmDelete(false);
                      }}>
                        Bekreft sletting
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-destructive/10 border border-red-300 dark:border-destructive text-red-900 dark:text-destructive px-4 py-3 rounded">
              <p className="font-semibold">Feil ved lasting av data</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 text-gray-600 dark:text-muted-foreground">Prøver å bruke lokal lagring i stedet...</p>
            </div>
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/50">
              <AlertDescription className="text-sm text-blue-900 dark:text-blue-200">
                💡 Tip: Data fungerer nå, men lagres kun lokalt i nettleseren. 
                Backend må deployes for permanent lagring på tvers av enheter.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            {/* Mobile Tabs */}
            <div className="lg:hidden">
              <Tabs defaultValue="restaurants" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-6">
                  <TabsTrigger value="restaurants">Restauranter</TabsTrigger>
                  <TabsTrigger value="scoreboards">Rangeringer</TabsTrigger>
                </TabsList>

                {/* Restaurants Tab */}
                <TabsContent value="restaurants" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <h2 className="text-2xl font-semibold">Restauranter ({restaurants.length})</h2>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Label htmlFor="sort-mobile" className="whitespace-nowrap text-sm">Sorter:</Label>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger id="sort-mobile" className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="date">Dato</SelectItem>
                              <SelectItem value="score">Score</SelectItem>
                              {PARTICIPANTS.map((participant) => (
                                <SelectItem key={participant} value={participant}>
                                  Ansvarlig: {participant}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <AddRestaurantDialog participants={PARTICIPANTS} onAdd={handleAddRestaurant} />
                      </div>
                    </div>
                    {/* Current Participant Info */}
                    {currentParticipant !== 'Ingen' && (
                      <Alert className="bg-sky-50 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800/50">
                        <AlertDescription className="text-sm text-sky-900 dark:text-sky-200 inline">
                          Rangerer som: <span className="font-semibold">{currentParticipant}</span>
                        </AlertDescription>
                      </Alert>
                    )}
                    {/* Warning when no participant is selected */}
                    {currentParticipant === 'Ingen' && (
                      <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800/50">
                        <AlertDescription className="text-sm text-yellow-900 dark:text-yellow-200">
                          Du må velge en bruker for å kunne rangere restauranter
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-4">
                      {sortedRestaurants.map((restaurant) => (
                        <RestaurantCard
                          key={restaurant.id}
                          restaurant={restaurant}
                          participants={PARTICIPANTS}
                          currentParticipant={currentParticipant}
                          onRatingChange={handleRatingChange}
                          onSaveRating={handleSaveRating}
                          onDateChange={handleDateChange}
                          onNameChange={handleNameChange}
                          isOpen={openAccordionId === restaurant.id}
                          onOpenChange={(open) => setOpenAccordionId(open ? restaurant.id : null)}
                          isSaving={savingRestaurantId === restaurant.id}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Scoreboards Tab */}
                <TabsContent value="scoreboards" className="space-y-6">
                  <Scoreboard
                    title="Topp restauranter"
                    description="Rangert etter gjennomsnittlig score"
                    items={restaurantRankings}
                    initialLimit={10}
                    expandable={true}
                    showBottomEmojis={true}
                  />
                  <Scoreboard
                    title="Deltager-rangeringer"
                    description="Gjennomsnittlig score per deltager"
                    items={participantRankings}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Restaurant List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Restauranter ({restaurants.length})</h2>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="sort">Sorter etter:</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger id="sort" className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Dato</SelectItem>
                        <SelectItem value="score">Score</SelectItem>
                        {PARTICIPANTS.map((participant) => (
                          <SelectItem key={participant} value={participant}>
                            Ansvarlig: {participant}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AddRestaurantDialog participants={PARTICIPANTS} onAdd={handleAddRestaurant} />
                  </div>
                </div>
                {/* Current Participant Info */}
                {currentParticipant !== 'Ingen' && (
                  <Alert className="bg-sky-50 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800/50">
                    <AlertDescription className="text-sm text-sky-900 dark:text-sky-200 inline">
                      Rangerer som: <span className="font-semibold">{currentParticipant}</span>
                    </AlertDescription>
                  </Alert>
                )}
                {/* Warning when no participant is selected */}
                {currentParticipant === 'Ingen' && (
                  <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800/50">
                    <AlertDescription className="text-sm text-yellow-900 dark:text-yellow-200">
                      Du må velge en bruker for å kunne rangere restauranter
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  {sortedRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      participants={PARTICIPANTS}
                      currentParticipant={currentParticipant}
                      onRatingChange={handleRatingChange}
                      onSaveRating={handleSaveRating}
                      onDateChange={handleDateChange}
                      onNameChange={handleNameChange}
                      isOpen={openAccordionId === restaurant.id}
                      onOpenChange={(open) => setOpenAccordionId(open ? restaurant.id : null)}
                      isSaving={savingRestaurantId === restaurant.id}
                    />
                  ))}
                </div>
              </div>

              {/* Scoreboards */}
              <div className="space-y-6">
                <Scoreboard
                  title="Topp restauranter"
                  description="Rangert etter gjennomsnittlig score"
                  items={restaurantRankings}
                  initialLimit={10}
                  expandable={true}
                  showBottomEmojis={true}
                />
                <Scoreboard
                  title="Deltager-rangeringer"
                  description="Gjennomsnittlig score per deltager"
                  items={participantRankings}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}