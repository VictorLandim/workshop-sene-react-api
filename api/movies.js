const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // const { cityId } = req.params;
    const cityId = 12;

    const theaterResponse = await axios.get(
      `https://api-content.ingresso.com/v0/theaters/city/${cityId}`
    );

    const allTheaters = theaterResponse.data
      .filter(e => e.enabled)
      .map(({ name, id, geolocation }) => ({
        name,
        id,
        mapUrl: `https://www.google.com/maps/place/${geolocation.lat},${geolocation.lng}`
      }));

    const sessionsPromises = allTheaters.map(theater =>
      axios.get(`https://api-content.ingresso.com/v0/sessions/city/${cityId}/theater/${theater.id}`)
    );

    const sessionsResponse = await Promise.all(sessionsPromises);

    const allSessions = sessionsResponse.map(session => session.data);

    const sessions = allTheaters.map((theater, i) => ({
      ...theater,
      movies: allSessions[i]
        .filter(session => session.isToday)[0]
        .movies.map(({ id, title, duration, contentRating, trailers, images, rooms, genres }) => ({
          id,
          title,
          duration,
          contentRating,
          genres,
          imageUrl: images[0].url,
          trailerUrl: trailers.length > 0 ? trailers[0].url : null,
          rooms: rooms.map(({ name, sessions }) => ({
            name,
            types: sessions[0].types.map(t => t.alias),
            sessions: sessions.map(({ id, price, date, time, siteURL }) => ({
              id,
              price,
              date,
              time,
              ticketUrl: siteURL
            }))
          }))
        }))
    }));

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.', message: JSON.stringify(error) });
  }
};
