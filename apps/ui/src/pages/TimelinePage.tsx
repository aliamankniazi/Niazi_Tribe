import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Person, LifeEvent } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CardMedia,
  Chip,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  School as EducationIcon,
  Work as CareerIcon,
  Favorite as MarriageIcon,
  HeartBroken as DivorceIcon,
  Home as ResidenceIcon,
  Flight as ImmigrationIcon,
  Military as MilitaryIcon,
  EmojiEvents as AchievementIcon,
  LocalHospital as MedicalIcon,
  Event as OtherIcon,
  ChildCare as BirthIcon,
  RemoveCircle as DeathIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const eventIcons: Record<string, React.ReactElement> = {
  birth: <BirthIcon />,
  death: <DeathIcon />,
  marriage: <MarriageIcon />,
  divorce: <DivorceIcon />,
  education: <EducationIcon />,
  career: <CareerIcon />,
  residence: <ResidenceIcon />,
  immigration: <ImmigrationIcon />,
  military: <MilitaryIcon />,
  achievement: <AchievementIcon />,
  medical: <MedicalIcon />,
  other: <OtherIcon />
};

const eventColors: Record<string, string> = {
  birth: '#4CAF50',
  death: '#9E9E9E',
  marriage: '#E91E63',
  divorce: '#F44336',
  education: '#2196F3',
  career: '#FF9800',
  residence: '#795548',
  immigration: '#3F51B5',
  military: '#607D8B',
  achievement: '#FFC107',
  medical: '#00BCD4',
  other: '#9C27B0'
};

interface TimelineEvent extends LifeEvent {
  person: Person;
}

export default function TimelinePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventType: 'all',
    person: 'all',
    startDate: '',
    endDate: ''
  });
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const personsQuery = query(
          collection(db, 'persons'),
          where('treeId', '==', 'default') // TODO: Get from context
        );
        
        const personsSnapshot = await getDocs(personsQuery);
        const personsData = personsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Person));
        
        setPeople(personsData);

        // Collect all life events
        const allEvents: TimelineEvent[] = [];
        personsData.forEach(person => {
          if (person.lifeEvents) {
            person.lifeEvents.forEach(event => {
              allEvents.push({
                ...event,
                person
              });
            });
          }

          // Add birth and death as events if they exist
          if (person.dob) {
            allEvents.push({
              id: `birth-${person.id}`,
              type: 'birth',
              date: person.dob,
              description: `Birth of ${person.name}`,
              title: 'Birth',
              location: person.birthPlace,
              metadata: person.metadata,
              person
            });
          }

          if (person.dod) {
            allEvents.push({
              id: `death-${person.id}`,
              type: 'death',
              date: person.dod,
              description: `Death of ${person.name}`,
              title: 'Death',
              location: person.deathPlace,
              metadata: person.metadata,
              person
            });
          }
        });

        // Sort events by date
        allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEvents(allEvents);
      } catch (error) {
        console.error('Error loading timeline data:', error);
      }

      setLoading(false);
    };

    loadData();
  }, [user]);

  const filteredEvents = events.filter(event => {
    if (filters.eventType !== 'all' && event.type !== filters.eventType) {
      return false;
    }

    if (filters.person !== 'all' && event.person.id !== filters.person) {
      return false;
    }

    if (filters.startDate && new Date(event.date) < new Date(filters.startDate)) {
      return false;
    }

    if (filters.endDate && new Date(event.date) > new Date(filters.endDate)) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading timeline...</Typography>
      </Box>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Typography variant="h4" gutterBottom>
        Family Timeline
      </Typography>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 4, p: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={filters.eventType}
              onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
              label="Event Type"
            >
              <MenuItem value="all">All Events</MenuItem>
              {Object.keys(eventIcons).map(type => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Person</InputLabel>
            <Select
              value={filters.person}
              onChange={(e) => setFilters(prev => ({ ...prev, person: e.target.value }))}
              label="Person"
            >
              <MenuItem value="all">All People</MenuItem>
              {people.map(person => (
                <MenuItem key={person.id} value={person.id}>
                  {person.name} {person.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            label="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            type="date"
            label="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Card>

      {/* Timeline */}
      <Timeline position="alternate">
        {filteredEvents.map((event) => (
          <TimelineItem key={event.id}>
            <TimelineOppositeContent>
              <Typography variant="body2" color="textSecondary">
                {new Date(event.date).toLocaleDateString()}
              </Typography>
              {event.endDate && (
                <Typography variant="caption" color="textSecondary">
                  to {new Date(event.endDate).toLocaleDateString()}
                </Typography>
              )}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot sx={{ bgcolor: eventColors[event.type] }}>
                {eventIcons[event.type]}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <div>
                      <Typography variant="h6">
                        {event.title || event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Typography>
                      <Link
                        component={RouterLink}
                        to={`/person/${event.person.id}`}
                        color="primary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}
                      >
                        <PersonIcon fontSize="small" />
                        {event.person.name} {event.person.lastName}
                      </Link>
                      <Typography variant="body2" color="textSecondary">
                        {event.description}
                      </Typography>
                      {event.location && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          📍 {event.location}
                        </Typography>
                      )}
                    </div>
                  </Box>

                  {event.relatedPersons && event.relatedPersons.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="caption" color="textSecondary">
                        Related People:
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                        {event.relatedPersons.map(personId => {
                          const person = people.find(p => p.id === personId);
                          return person ? (
                            <Chip
                              key={personId}
                              label={`${person.name} ${person.lastName}`}
                              component={RouterLink}
                              to={`/person/${personId}`}
                              clickable
                              size="small"
                            />
                          ) : null;
                        })}
                      </Box>
                    </Box>
                  )}

                  {event.media && event.media.length > 0 && (
                    <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                      {event.media.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: 100,
                            height: 100,
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 1
                          }}
                        >
                          {item.type === 'image' ? (
                            <CardMedia
                              component="img"
                              image={item.url}
                              alt={item.caption || ''}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'grey.100'
                              }}
                            >
                              Document
                            </Box>
                          )}
                          {item.caption && (
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                p: 0.5,
                                textAlign: 'center'
                              }}
                            >
                              {item.caption}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>

      {filteredEvents.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            No events found for the selected filters.
          </Typography>
        </Box>
      )}
    </div>
  );
} 